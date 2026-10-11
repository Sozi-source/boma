import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/security/payment-validation';

export const runtime = 'nodejs';

// POST /api/payments/paystack/vote
// Body: { payout_request_id: string, vote: 'approve' | 'reject' }
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const payoutRequestId = typeof body.payout_request_id === 'string' ? body.payout_request_id.trim() : '';
    const vote = body.vote;
    if (!/^[0-9a-f-]{36}$/i.test(payoutRequestId)) {
      return NextResponse.json({ error: 'Invalid payout request ID' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(vote)) {
      return NextResponse.json({ error: 'Vote must be "approve" or "reject"' }, { status: 400 });
    }

    const db = createAdminClient();

    // Verify the payout request exists and is still pending
    const { data: pr, error: prError } = await db.from('payout_requests')
      .select('id, boma_id, status').eq('id', payoutRequestId).maybeSingle();
    if (prError || !pr) return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    if (pr.status !== 'pending') {
      return NextResponse.json({ error: 'This payout request is no longer pending' }, { status: 409 });
    }

    // Verify caller is the organizer or a committee member for this boma
    const { data: boma } = await db.from('bomas').select('creator_id').eq('id', pr.boma_id).maybeSingle();
    const { data: committee } = await db.from('committees').select('members').eq('boma_id', pr.boma_id).maybeSingle();
    const memberList: string[] = committee?.members ?? [];
    const isOrganizer = boma?.creator_id === user.id;
    const isMember = memberList.includes(user.id);
    if (!isOrganizer && !isMember) {
      return NextResponse.json({ error: 'You are not a committee member for this fund' }, { status: 403 });
    }

    // Record the vote — UNIQUE constraint prevents double-voting
    const { error: voteError } = await db.from('payout_votes').insert({
      payout_request_id: payoutRequestId,
      voter_id: user.id,
      vote,
    });
    if (voteError) {
      if (voteError.code === '23505') {
        return NextResponse.json({ error: 'You have already voted on this payout request' }, { status: 409 });
      }
      throw voteError;
    }

    // Return current vote tally
    const { data: tally } = await db.from('payout_votes')
      .select('vote').eq('payout_request_id', payoutRequestId);
    const approvals = tally?.filter(v => v.vote === 'approve').length ?? 0;
    const rejections = tally?.filter(v => v.vote === 'reject').length ?? 0;

    return NextResponse.json({ recorded: true, approvals, rejections }, { status: 201 });
  } catch (error) {
    console.error('Vote recording failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to record vote' }, { status: 503 });
  }
}

// GET /api/payments/paystack/vote?payout_request_id=...
// Returns vote tally and quorum status for a payout request
export async function GET(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const payoutRequestId = searchParams.get('payout_request_id') ?? '';
    if (!/^[0-9a-f-]{36}$/i.test(payoutRequestId)) {
      return NextResponse.json({ error: 'Invalid payout request ID' }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: votes, error } = await db.from('payout_votes')
      .select('voter_id, vote, created_at').eq('payout_request_id', payoutRequestId);
    if (error) throw error;

    const { data: quorumResult } = await db.rpc('check_payout_quorum', {
      p_payout_request_id: payoutRequestId,
    });

    const approvals = votes?.filter(v => v.vote === 'approve').length ?? 0;
    const rejections = votes?.filter(v => v.vote === 'reject').length ?? 0;
    const myVote = votes?.find(v => v.voter_id === user.id)?.vote ?? null;

    return NextResponse.json({ approvals, rejections, quorum_met: quorumResult ?? false, my_vote: myVote });
  } catch (error) {
    console.error('Vote tally failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to fetch vote tally' }, { status: 503 });
  }
}

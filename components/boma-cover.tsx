'use client';

import { useState } from 'react';
import type { Boma, BomaCategory } from '@/lib/types/fintech';

interface CoverVariant {
  path: string;
  width: number;
}

const CATEGORY_COVERS: Partial<Record<BomaCategory, CoverVariant[]>> = {
  family: [
    { path: '/assets/images/funds/family/family_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/family/family_720w_tablet.webp', width: 720 },
    { path: '/assets/images/funds/family/family_1080w_web.webp', width: 1080 },
    { path: '/assets/images/funds/family/family_1440w_web-xl.webp', width: 1440 },
  ],
  education: [
    { path: '/assets/images/funds/education/education_360w_mobile.webp', width: 360 },
  ],
  medical: [
    { path: '/assets/images/funds/medical/medical_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/medical/medical_720w_tablet.webp', width: 720 },
    { path: '/assets/images/funds/medical/medical_1080w_web.webp', width: 1080 },
  ],
  community: [
    { path: '/assets/images/funds/community/community_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/community/community_720w_tablet.webp', width: 720 },
    { path: '/assets/images/funds/community/community_1080w_web.webp', width: 1080 },
  ],
  business: [
    { path: '/assets/images/funds/business/business_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/business/business_720w_tablet.webp', width: 720 },
    { path: '/assets/images/funds/business/business_1080w_web.webp', width: 1080 },
  ],
};

interface BomaCoverProps {
  boma: Pick<Boma, 'category' | 'image_url'>;
  className: string;
  imageClassName?: string;
  sizes?: string;
}

export default function BomaCover({
  boma,
  className,
  imageClassName = 'h-full w-full object-cover',
  sizes = '(max-width: 639px) 50vw, (max-width: 1023px) 50vw, 33vw',
}: BomaCoverProps) {
  const customSource = boma.image_url?.trim();
  const variants = customSource ? undefined : CATEGORY_COVERS[boma.category];
  const source = customSource || variants?.[0]?.path;
  if (!source) return null;

  const sourceSet = variants?.map(({ path, width }) => `${path} ${width}w`).join(', ');

  return (
    <CoverImage
      key={source}
      source={source}
      sourceSet={sourceSet}
      sizes={sizes}
      className={className}
      imageClassName={imageClassName}
    />
  );
}

function CoverImage({ source, sourceSet, sizes, className, imageClassName }: {
  source: string;
  sourceSet?: string;
  sizes: string;
  className: string;
  imageClassName: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) return null;

  return (
    <div className={className}>
      <img
        src={source}
        srcSet={sourceSet}
        sizes={sourceSet ? sizes : undefined}
        alt=""
        aria-hidden="true"
        className={imageClassName}
        loading="lazy"
        decoding="async"
        onError={() => setUnavailable(true)}
      />
    </div>
  );
}

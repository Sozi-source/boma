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
    { path: '/assets/images/funds/education/pexels-artempodrez-8088092.webp', width: 900 },
    { path: '/assets/images/funds/education/pexels-valerie-sutton-34163824-14935332.webp', width: 1600 },
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
    { path: '/assets/images/funds/community/pexels-droneafrica-12431091.webp', width: 1600 },
  ],
  chama: [
    { path: '/assets/images/funds/community/pexels-droneafrica-12431091.webp', width: 1600 },
  ],
  food: [
    { path: '/assets/images/funds/community/rural/pexels-oladele-olaniyi-541492341-16658745.webp', width: 1119 },
    { path: '/assets/images/funds/community/pexels-newmanphotographs-16934845.webp', width: 1600 },
  ],
  housing: [
    { path: '/assets/images/africa/landscapes/pexels-isaac-naph-567522839-20730310.webp', width: 1600 },
  ],
  travel: [
    { path: '/assets/images/africa/nature/pexels-recep-kolcu-2161306727-40059571.webp', width: 1600 },
  ],
  sports: [
    { path: '/assets/images/events/pexels-rdne-7551733.webp', width: 1600 },
  ],
  funeral: [
    { path: '/assets/images/funds/family/family_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/family/family_1080w_web.webp', width: 1080 },
  ],
  wedding: [
    { path: '/assets/images/funds/family/family_360w_mobile.webp', width: 360 },
    { path: '/assets/images/funds/family/family_1080w_web.webp', width: 1080 },
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

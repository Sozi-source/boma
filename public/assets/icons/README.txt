Icons as WebP, names kept: openhand, records, group, goal.
Sizes (px, square): 32, 48, 64, 96, 128, 192, 256, 384, 512. openhand also has 640, 768, 1024, 1254.
Pattern: <name>-<size>.webp, e.g. goal-96.webp

records, group, goal keep transparency. openhand is a rounded-square app icon on a WHITE background (no transparency),
so it will show a white square on dark or coloured backgrounds.

Pick the size at about 2x the displayed size for sharp phone screens (a 24px icon -> use the 48 file).

next/image:  <Image src="/assets/icons/goal-96.webp" alt="" width={48} height={48} />
srcset:      <img src="goal-48.webp" srcset="goal-48.webp 1x, goal-96.webp 2x, goal-128.webp 3x" width="48" height="48" alt="">

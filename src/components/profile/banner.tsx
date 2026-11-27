"use client";

import Image from "next/image";

import { useProfileLook } from "@/components/profile/theme-scope";

/** Banner image, or a solid band in the owner's accent color. */
export function ProfileBanner() {
  const { bannerUrl } = useProfileLook();
  return (
    <div className="relative h-36 w-full overflow-hidden bg-accent sm:h-52">
      {bannerUrl && <Image src={bannerUrl} alt="" fill unoptimized priority className="object-cover" />}
    </div>
  );
}

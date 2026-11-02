import Image, { type StaticImageData } from "next/image";

/**
 * One real photograph: a trader's own notebook. Drop the file in next to this component and set
 * NOTEBOOK_PHOTO, e.g.
 *   import notebook from "./notebook.jpg";
 *   export const NOTEBOOK_PHOTO = { src: notebook, alt: "…", credit: "Photo: …, with permission" };
 * Real photo only, taken with the trader's permission. No stock photos, no people.
 */
export const NOTEBOOK_PHOTO: { src: StaticImageData; alt: string; credit: string } | null = null;

export function NotebookPhoto({ photo = NOTEBOOK_PHOTO, className = "" }: { photo?: typeof NOTEBOOK_PHOTO; className?: string }) {
  return (
    <figure className={className} data-demo="notebook-photo">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-ink/12 bg-[#F7F6F2] lg:aspect-[4/5]">
        {photo ? (
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" placeholder="blur" />
        ) : (
          <div role="img" aria-label="Placeholder for a photo of a trader's notebook" className="absolute inset-0">
            {/* a reserved frame, drawn like the page of an exercise book: faint rules, one margin line */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(45,44,42,0.07) 31px 32px)", backgroundPosition: "0 18px" }}
            />
            <div aria-hidden className="absolute inset-y-0 left-[18%] w-px bg-owed/25" />
            <div className="absolute bottom-0 left-[18%] right-0 py-6 pl-5 pr-6 lg:py-7">
              <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-ink-3">Photo to come</p>
              <p className="mt-2 max-w-[22ch] text-[22px] leading-[1.15] tracking-[-0.01em] text-ink-2">A trader&apos;s own notebook, photographed at the stall.</p>
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-3 font-sans text-[12px] text-ink-3">
        {photo ? photo.credit : "The book Kobo replaces: pages of names, amounts and crossings-out."}
      </figcaption>
    </figure>
  );
}

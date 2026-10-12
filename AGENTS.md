<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Storefront data goes through `src/lib/api/*` service modules; they call the external REST API when `VITE_API_BASE_URL` is set and fall back to sample data otherwise — keeps the UI ready for the separate C# backend without faking orders.
- Store-wide queries are prefetched in the root loader with SSR query integration — avoids hydration mismatches.
- Page entrances use the shared PageTransition inside storefront and admin content layouts, triggered only by pathname-changing onRendered router events, not URL updates or React remounts — animates the committed destination while preserving filters, forms, and persistent navigation and respecting reduced motion.

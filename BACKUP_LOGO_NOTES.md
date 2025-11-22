# Backup Monochrome Logo

This repository was reverted to commit `653ecae` (pre-logo integration). The animated monochrome CourseScope logo component has been preserved at `backup/Logo_monochrome.jsx`.

## How to Restore the Logo
1. Copy the file:
   ```bash
   cp backup/Logo_monochrome.jsx src/components/Logo.jsx
   ```
2. Edit `src/components/Header.jsx` and import the new component:
   ```jsx
   import Logo from './Logo.jsx';
   ```
3. Replace the existing `<img ... />` element with `<Logo />` (optionally wrapped for hover effects):
   ```jsx
   <div className="transition-transform duration-300 group-hover:scale-[1.04]">
     <Logo />
   </div>
   ```
4. Run build locally:
   ```bash
   npm run build
   ```
5. Commit and push:
   ```bash
   git add src/components/Logo.jsx src/components/Header.jsx
   git commit -m "Restore animated monochrome logo"
   git push origin main
   ```

## Optional Tweaks
- Add subtle pulse to the ring: animate strokeOpacity.
- Slow rotation: increase duration to 10s.
- Dark mode adaptation: invert background gradient stops.

## Reference
This backup matches the monochrome palette (black → slate → gray) and retains all animation behaviors (slight rotational drift + cap float).

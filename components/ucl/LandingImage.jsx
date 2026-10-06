import images from './landing-images.json';

export function imageSourceSet(name, format) {
  return images[name].widths.map(width => `/landing-reference/responsive/${name}-${width}.${format} ${width}w`).join(', ');
}

export default function LandingImage({ name, alt = '', className = '', sizes = '(min-width: 1280px) 384px, (min-width: 768px) 33vw, calc(100vw - 48px)', eager = false, ...props }) {
  const image = images[name];
  return <picture>
    <source type="image/avif" srcSet={imageSourceSet(name, 'avif')} sizes={sizes} />
    <img {...props} className={className} src={`/landing-reference/responsive/${name}-${image.width}.webp`} srcSet={imageSourceSet(name, 'webp')} sizes={sizes} width={image.width} height={image.height} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'} />
  </picture>;
}

export default function Image({ src, unoptimized, priority, fill, quality, loader, ...props }) { return <img src={typeof src === 'string' ? src : src?.src} {...props} /> }

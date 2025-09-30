const resolveDistDir = () => {
  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }

  if (process.env.NODE_ENV !== 'development') {
    return '.next';
  }

  const port = process.env.PORT;

  if (!port) {
    return '.next';
  }

  return `.next-${port}`;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: resolveDistDir(),
};

export default nextConfig;

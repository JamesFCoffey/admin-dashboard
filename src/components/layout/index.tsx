import { ThemedLayoutV2, ThemedTitleV2 } from '@refinedev/antd';
import Image from 'next/image';
import Header from './header';
import React from 'react';

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <ThemedLayoutV2
      Header={Header}
      Title={(titleProps) => (
        <ThemedTitleV2
          {...titleProps}
          text=""
          icon={
            <Image
              src="/brand-mark.svg"
              alt="Dunder Mifflin logo"
              width={48}
              height={48}
              priority
            />
          }
        />
      )}
    >
      {children}
    </ThemedLayoutV2>
  );
};

export default Layout;

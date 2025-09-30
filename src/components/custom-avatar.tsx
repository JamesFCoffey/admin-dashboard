import React from 'react';
import { getNameInitials } from '@/utilities';
import { Avatar as AntdAvatar, AvatarProps } from 'antd';

import { AvatarResource, useCustomAvatar } from '@/utilities/custom-avatar-store';

type Props = AvatarProps & {
  name?: string;
  entityType?: AvatarResource;
  entityId?: string | number;
  preferProvidedSource?: boolean;
};

const CustomAvatar = ({
  name,
  style,
  entityType,
  entityId,
  src,
  preferProvidedSource = false,
  ...rest
}: Props) => {
  const overrideSrc = useCustomAvatar(entityType, entityId);

  const effectiveSrc = preferProvidedSource
    ? ((src as string | undefined) ?? overrideSrc)
    : (overrideSrc ?? (src as string | undefined));

  const initials = getNameInitials(name || '');

  return (
    <AntdAvatar
      alt={name}
      size="small"
      style={{
        backgroundColor: '#87d068',
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        ...style,
      }}
      src={effectiveSrc}
      {...rest}
    >
      {!effectiveSrc ? initials : null}
    </AntdAvatar>
  );
};

export default CustomAvatar;

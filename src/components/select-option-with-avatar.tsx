import CustomAvatar from "./custom-avatar";
import { Text } from "./text";

type Props = {
  name: string;
  avatarUrl?: string;
  entityType?: "companies" | "users";
  entityId?: string | number;
  shape?: "circle" | "square";
};

const SelectOptionWithAvatar = ({
  avatarUrl,
  name,
  shape,
  entityType,
  entityId,
}: Props) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <CustomAvatar
        shape={shape}
        name={name}
        src={avatarUrl}
        entityType={entityType}
        entityId={entityId}
      />
      <Text>{name}</Text>
    </div>
  );
};

export default SelectOptionWithAvatar;

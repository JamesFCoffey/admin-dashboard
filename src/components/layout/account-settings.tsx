import { useMemo, useState } from 'react';

import { SaveButton, useForm } from '@refinedev/antd';
import { HttpError } from '@refinedev/core';
import { GetFields, GetVariables } from '@refinedev/nestjs-query';

import { CloseOutlined, DeleteOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Form, Input, Spin, Space, Upload } from 'antd';

import { getNameInitials } from '@/utilities';
import { UPDATE_USER_MUTATION } from '@/graphql/mutations';

import { Text } from '../text';
import CustomAvatar from '../custom-avatar';

import { UpdateUserMutation, UpdateUserMutationVariables } from '@/graphql/types';
import type { RcFile } from 'antd/es/upload/interface';
import {
  customAvatarStore,
  readFileAsDataUrl,
  useCustomAvatar,
} from '@/utilities/custom-avatar-store';

type Props = {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  userId: string;
};

export const AccountSettings = ({ opened, setOpened, userId }: Props) => {
  /**
   * useForm in Refine is used to manage forms. It provides us with a lot of useful props and methods that we can use to manage forms.
   * https://refine.dev/docs/data/hooks/use-form/#usage
   */

  /**
   * saveButtonProps -> contains all the props needed by the "submit" button. For example, "loading", "disabled", "onClick", etc.
   * https://refine.dev/docs/ui-integrations/ant-design/hooks/use-form/#savebuttonprops
   *
   * formProps -> It's an instance of HTML form that manages form state and actions like onFinish, onValuesChange, etc.
   * https://refine.dev/docs/ui-integrations/ant-design/hooks/use-form/#form
   *
   * queryResult -> contains the result of the query. For example, isLoading, data, error, etc.
   * https://refine.dev/docs/packages/react-hook-form/use-form/#queryresult
   */
  const { saveButtonProps, formProps, queryResult } = useForm<
    /**
     * GetFields is used to get the fields of the mutation i.e., in this case, fields are name, email, jobTitle, and phone
     * https://refine.dev/docs/data/packages/nestjs-query/#getfields
     */
    GetFields<UpdateUserMutation>,
    // a type that represents an HTTP error. Used to specify the type of error mutation can throw.
    HttpError,
    // A third type parameter used to specify the type of variables for the UpdateUserMutation. Meaning that the variables for the UpdateUserMutation should be of type UpdateUserMutationVariables
    GetVariables<UpdateUserMutationVariables>
  >({
    /**
     * mutationMode is used to determine how the mutation should be performed. For example, optimistic, pessimistic, undoable etc.
     * optimistic -> redirection and UI updates are executed immediately as if the mutation is successful.
     * pessimistic -> redirection and UI updates are executed after the mutation is successful.
     * https://refine.dev/docs/advanced-tutorials/mutation-mode/#overview
     */
    mutationMode: 'optimistic',
    /**
     * specify on which resource the mutation should be performed
     * if not specified, Refine will determine the resource name by the current route
     */
    resource: 'users',
    /**
     * specify the action that should be performed on the resource. Behind the scenes, Refine calls useOne hook to get the data of the user for edit action.
     * https://refine.dev/docs/data/hooks/use-form/#edit
     */
    action: 'edit',
    id: userId,
    /**
     * used to provide any additional information to the data provider.
     * https://refine.dev/docs/data/hooks/use-form/#meta-
     */
    meta: {
      // gqlMutation is used to specify the mutation that should be performed.
      gqlMutation: UPDATE_USER_MUTATION,
    },
  });
  const userRecord = queryResult?.data?.data;
  const serverAvatar = userRecord?.avatarUrl ?? undefined;
  const userName = userRecord?.name ?? '';

  const customAvatar = useCustomAvatar('users', userId);

  const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(undefined);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const displayAvatar = useMemo(() => {
    if (pendingAvatar !== undefined) {
      return pendingAvatar ?? serverAvatar;
    }

    return customAvatar ?? serverAvatar;
  }, [pendingAvatar, customAvatar, serverAvatar]);

  const handleAvatarUpload = async (file: RcFile) => {
    try {
      setIsAvatarUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      setPendingAvatar(dataUrl);
    } catch (error) {
      console.error('Failed to process profile image', error);
    } finally {
      setIsAvatarUploading(false);
    }

    return false;
  };

  const handleAvatarRemoval = () => {
    if (pendingAvatar === null) {
      setPendingAvatar(undefined);
      return;
    }

    setPendingAvatar(null);
  };

  const { onFinish: originalOnFinish, ...restFormProps } = formProps;

  const handleFinish: typeof originalOnFinish = async (values) => {
    const result = await originalOnFinish?.(values);

    if ((result as boolean | undefined) === false) {
      return result;
    }

    if (pendingAvatar !== undefined) {
      if (pendingAvatar) {
        customAvatarStore.setAvatar('users', userId, pendingAvatar);
      } else {
        customAvatarStore.clearAvatar('users', userId);
      }
    }

    setPendingAvatar(undefined);

    return result;
  };

  const closeModal = () => {
    setOpened(false);
  };

  // if query is processing, show a loading indicator
  if (queryResult?.isLoading) {
    return (
      <Drawer
        open={opened}
        width={756}
        styles={{
          body: {
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <Spin />
      </Drawer>
    );
  }

  return (
    <Drawer
      onClose={closeModal}
      open={opened}
      width={756}
      styles={{
        body: { background: '#f5f5f5', padding: 0 },
        header: { display: 'none' },
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: '#fff',
        }}
      >
        <Text strong>Account Settings</Text>
        <Button type="text" icon={<CloseOutlined />} onClick={() => closeModal()} />
      </div>
      <div
        style={{
          padding: '16px',
        }}
      >
        <Card>
          <Form {...restFormProps} layout="vertical" onFinish={handleFinish}>
            <Space direction="vertical" size={12} style={{ marginBottom: '24px' }}>
              <CustomAvatar
                shape="square"
                src={displayAvatar}
                name={getNameInitials(userName)}
                entityType="users"
                entityId={userId}
                preferProvidedSource={pendingAvatar !== undefined}
                style={{ width: 96, height: 96 }}
              />
              <Space size={8} wrap>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleAvatarUpload}
                  disabled={isAvatarUploading}
                >
                  <Button icon={<UploadOutlined />} loading={isAvatarUploading}>
                    Upload photo
                  </Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleAvatarRemoval}
                  disabled={pendingAvatar === undefined && !customAvatar}
                >
                  Remove custom photo
                </Button>
                <Text size="xs" className="tertiary">
                  Profile pictures are stored locally. Save changes to keep updates.
                </Text>
              </Space>
            </Space>
            <Form.Item label="Name" name="name">
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item label="Job title" name="jobTitle">
              <Input placeholder="e.g., Manager" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="e.g., +1 610-867-5309" />
            </Form.Item>
          </Form>
          <SaveButton
            {...saveButtonProps}
            icon={<SaveOutlined style={{ marginRight: 6 }} />}
            style={{
              display: 'block',
              marginLeft: 'auto',
            }}
          >
            Save
          </SaveButton>
        </Card>
      </div>
    </Drawer>
  );
};

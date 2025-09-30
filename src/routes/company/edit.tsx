import { useMemo, useState } from "react";

import { Button, Col, Form, Input, Row, Select, Space, Upload } from "antd";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { UPDATE_COMPANY_MUTATION } from "@/graphql/mutations";
import CustomAvatar from "@/components/custom-avatar";
import { getNameInitials } from "@/utilities";
import { GetFieldsFromList } from "@refinedev/nestjs-query";
import { UsersSelectQuery } from "@/graphql/types";
import { USERS_SELECT_QUERY } from "@/graphql/queries";
import SelectOptionWithAvatar from "@/components/select-option-with-avatar";
import {
  businessTypeOptions,
  companySizeOptions,
  industryOptions,
} from "@/constants";
import { CompanyContactsTable } from "./contacts-table";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";
import {
  customAvatarStore,
  readFileAsDataUrl,
  useCustomAvatar,
} from "@/utilities/custom-avatar-store";
import { Text } from "@/components/text";

const EditPage = () => {
  const { saveButtonProps, formProps, formLoading, queryResult } = useForm({
    redirect: false,
    meta: {
      gqlMutation: UPDATE_COMPANY_MUTATION,
    },
  });

  const companyRecord = queryResult?.data?.data;
  const companyId = companyRecord?.id;
  const companyName = companyRecord?.name ?? "";
  const serverAvatar = companyRecord?.avatarUrl ?? undefined;

  const customLogo = useCustomAvatar("companies", companyId);

  const [pendingLogo, setPendingLogo] = useState<string | null | undefined>(
    undefined,
  );
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const displayLogo = useMemo(() => {
    if (pendingLogo !== undefined) {
      return pendingLogo ?? serverAvatar;
    }

    return customLogo ?? serverAvatar;
  }, [pendingLogo, customLogo, serverAvatar]);

  const handleLogoUpload = async (file: RcFile) => {
    try {
      setIsLogoUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      setPendingLogo(dataUrl);
    } catch (error) {
      console.error("Failed to process company logo", error);
    } finally {
      setIsLogoUploading(false);
    }

    return false;
  };

  const handleLogoRemoval = () => {
    if (pendingLogo === null) {
      setPendingLogo(undefined);
      return;
    }

    setPendingLogo(null);
  };

  const { onFinish: originalOnFinish, ...restFormProps } = formProps;

  const handleFinish: typeof originalOnFinish = async (values) => {
    const result = await originalOnFinish?.(values);

    if (result !== false && companyId) {
      if (pendingLogo !== undefined) {
        if (pendingLogo) {
          customAvatarStore.setAvatar("companies", companyId, pendingLogo);
        } else {
          customAvatarStore.clearAvatar("companies", companyId);
        }
      }

      setPendingLogo(undefined);
    }

    return result;
  };
  const { selectProps, queryResult: queryResultUsers } = useSelect<
    GetFieldsFromList<UsersSelectQuery>
  >({
    resource: "users",
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: USERS_SELECT_QUERY,
    },
  });
  return (
    <div>
      <Row gutter={[32, 32]}>
        <Col xs={24} xl={12}>
          <Edit
            isLoading={formLoading}
            saveButtonProps={saveButtonProps}
            breadcrumb={false}
          >
            <Form {...restFormProps} layout="vertical" onFinish={handleFinish}>
              <Space direction="vertical" size={12} style={{ marginBottom: "24px" }}>
                <CustomAvatar
                  shape="square"
                  src={displayLogo}
                  name={getNameInitials(companyName)}
                  entityType="companies"
                  entityId={companyId}
                  preferProvidedSource={pendingLogo !== undefined}
                  style={{ width: 96, height: 96 }}
                />
                <Space size={8} wrap>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleLogoUpload}
                    disabled={isLogoUploading}
                  >
                    <Button icon={<UploadOutlined />} loading={isLogoUploading}>
                      Upload logo
                    </Button>
                  </Upload>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={handleLogoRemoval}
                    disabled={pendingLogo === undefined && !customLogo}
                  >
                    Remove custom logo
                  </Button>
                  <Text size="xs" className="tertiary">
                    Logos are stored locally. Save changes to keep updates.
                  </Text>
                </Space>
              </Space>
              <Form.Item
                label="Sales owner"
                name="salesOwnerId"
                initialValue={formProps?.initialValues?.salesOwner?.id}
              >
                <Select
                  placeholder="Please select a sales owner"
                  {...selectProps}
                  options={
                    queryResultUsers.data?.data.map((user) => ({
                      value: user.id,
                      label: (
                        <SelectOptionWithAvatar
                          name={user.name}
                          avatarUrl={user.avatarUrl ?? undefined}
                          entityType="users"
                          entityId={user.id}
                        />
                      ),
                    })) ?? []
                  }
                />
              </Form.Item>
              <Form.Item
                label="Company size"
                name="companySize"
                initialValue={formProps?.initialValues?.companySize}
              >
                <Select
                  placeholder="Select company size"
                  options={companySizeOptions}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label="Industry"
                name="industry"
                initialValue={formProps?.initialValues?.industry}
              >
                <Select
                  placeholder="Select industry"
                  options={industryOptions}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label="Business type"
                name="businessType"
                initialValue={formProps?.initialValues?.businessType}
              >
                <Select
                  placeholder="Select business type"
                  options={businessTypeOptions}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Country" name="country">
                <Input placeholder="Country" />
              </Form.Item>
              <Form.Item label="Website" name="website">
                <Input placeholder="Website" />
              </Form.Item>
            </Form>
          </Edit>
        </Col>
        <Col xs={24} xl={12}>
          <CompanyContactsTable />
        </Col>
      </Row>
    </div>
  );
};

export default EditPage;

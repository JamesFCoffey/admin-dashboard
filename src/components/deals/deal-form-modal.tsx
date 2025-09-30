import { Form, Input, InputNumber, Modal, Select } from "antd";
import type { FormInstance, SelectProps } from "antd";

import type { DealFormValues } from "@/utilities/hooks";

export type DealFormModalProps = {
  title: string;
  open: boolean;
  form: FormInstance<DealFormValues>;
  onCancel: () => void;
  onSubmit: (values: DealFormValues) => Promise<void> | void;
  confirmLoading?: boolean;
  companyOptions?: SelectProps["options"];
  ownerOptions?: SelectProps["options"];
  stageOptions?: SelectProps["options"];
  companyLoading?: boolean;
  ownerLoading?: boolean;
  stageLoading?: boolean;
  companyOnSearch?: SelectProps["onSearch"];
  ownerOnSearch?: SelectProps["onSearch"];
  stageOnSearch?: SelectProps["onSearch"];
};

const DealFormModal = ({
  title,
  open,
  form,
  onCancel,
  onSubmit,
  confirmLoading = false,
  companyOptions = [],
  ownerOptions = [],
  stageOptions = [],
  companyLoading = false,
  ownerLoading = false,
  stageLoading = false,
  companyOnSearch,
  ownerOnSearch,
  stageOnSearch,
}: DealFormModalProps) => {
  return (
    <Modal
      open={open}
      title={title}
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      width={560}
    >
      <Form<DealFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          label="Deal title"
          name="title"
          rules={[{ required: true, message: "Please enter a deal title" }]}
        >
          <Input autoFocus placeholder="e.g. Annual software renewal" />
        </Form.Item>
        <Form.Item label="Value" name="value">
          <InputNumber
            min={0}
            step={1000}
            style={{ width: "100%" }}
            prefix="$"
            placeholder="e.g. 25000"
          />
        </Form.Item>
        <Form.Item
          label="Company"
          name="companyId"
          rules={[{ required: true, message: "Please select a company" }]}
        >
          <Select
            showSearch
            placeholder="Select a company"
            optionFilterProp="label"
            filterOption={false}
            loading={companyLoading}
            options={companyOptions}
            onSearch={companyOnSearch}
          />
        </Form.Item>
        <Form.Item
          label="Owner"
          name="dealOwnerId"
          rules={[{ required: true, message: "Please assign an owner" }]}
        >
          <Select
            showSearch
            placeholder="Assign an owner"
            optionFilterProp="label"
            filterOption={false}
            loading={ownerLoading}
            options={ownerOptions}
            onSearch={ownerOnSearch}
          />
        </Form.Item>
        <Form.Item
          label="Stage"
          name="stageId"
          rules={[{ required: true, message: "Please select a stage" }]}
        >
          <Select
            showSearch
            placeholder="Select a stage"
            optionFilterProp="label"
            loading={stageLoading}
            options={stageOptions}
            onSearch={stageOnSearch}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DealFormModal;

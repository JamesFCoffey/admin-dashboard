import { Form, Input, Modal, Select } from "antd";
import type { FormInstance, SelectProps } from "antd";

import { statusOptions } from "@/constants";
import type { ContactFormValues } from "@/utilities/hooks";

export type ContactFormModalProps = {
  title: string;
  open: boolean;
  form: FormInstance<ContactFormValues>;
  onCancel: () => void;
  onSubmit: (values: ContactFormValues) => Promise<void> | void;
  confirmLoading?: boolean;
  ownerOptions?: SelectProps["options"];
  ownerLoading?: boolean;
};

const ContactFormModal = ({
  title,
  open,
  form,
  onCancel,
  onSubmit,
  confirmLoading = false,
  ownerOptions = [],
  ownerLoading = false,
}: ContactFormModalProps) => {
  return (
    <Modal
      open={open}
      title={title}
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      width={512}
    >
      <Form<ContactFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          label="Full name"
          name="name"
          rules={[{ required: true, message: "Please enter a full name" }]}
        >
          <Input autoFocus placeholder="e.g. Pam Beesly" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="pam@dundermifflin.com" />
        </Form.Item>
        <Form.Item label="Job title" name="jobTitle">
          <Input placeholder="e.g. Office Administrator" />
        </Form.Item>
        <Form.Item label="Phone" name="phone">
          <Input placeholder="e.g. +1 570-555-0199" />
        </Form.Item>
        <Form.Item label="Status" name="status">
          <Select
            allowClear
            placeholder="Select a status"
            options={statusOptions}
          />
        </Form.Item>
        <Form.Item
          label="Sales owner"
          name="salesOwnerId"
          rules={[{ required: true, message: "Please select a sales owner" }]}
        >
          <Select
            showSearch
            placeholder="Assign a sales owner"
            optionFilterProp="label"
            filterOption={false}
            loading={ownerLoading}
            options={ownerOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContactFormModal;

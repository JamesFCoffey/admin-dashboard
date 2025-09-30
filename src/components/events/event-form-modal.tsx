import { DatePicker, Form, Input, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { FormInstance } from "antd";

import type { EventFormValues } from "@/utilities/hooks";

const { RangePicker } = DatePicker;

type InternalFormValues = {
  title: string;
  dateRange: [Dayjs, Dayjs];
  color: string;
};

export type EventFormModalProps = {
  title: string;
  open: boolean;
  form: FormInstance<InternalFormValues>;
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  confirmLoading?: boolean;
  defaultColor?: string;
};

const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf("day");
};

const EventFormModal = ({
  title,
  open,
  form,
  onCancel,
  onSubmit,
  confirmLoading = false,
  defaultColor = "#1677ff",
}: EventFormModalProps) => {
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
      <Form<InternalFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSubmit({
            title: values.title,
            color: values.color,
            startDate: values.dateRange[0].toISOString(),
            endDate: values.dateRange[1].toISOString(),
          })
        }
        initialValues={{
          color: defaultColor,
        }}
      >
        <Form.Item
          label="Event title"
          name="title"
          rules={[{ required: true, message: "Please enter an event title" }]}
        >
          <Input autoFocus placeholder="e.g. Q4 planning meeting" />
        </Form.Item>
        <Form.Item
          label="Date & time"
          name="dateRange"
          rules={[{ required: true, message: "Please select a start and end time" }]}
        >
          <RangePicker
            showTime
            style={{ width: "100%" }}
            format="MMM D, YYYY HH:mm"
            disabledDate={disabledDate}
          />
        </Form.Item>
        <Form.Item
          label="Color"
          name="color"
          rules={[{ required: true, message: "Please select a color" }]}
        >
          <Input type="color" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventFormModal;

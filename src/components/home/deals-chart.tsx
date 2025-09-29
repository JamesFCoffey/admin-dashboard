import { DollarOutlined } from "@ant-design/icons";
import { Alert, Card, Empty } from "antd";
import React from "react";
import { Text } from "../text";
import { Area, AreaConfig } from "@ant-design/plots";

import { useDealsChartData } from "@/utilities/hooks";

const DealsChart = () => {
  const { data, isLoading, isError, error, isEmpty } = useDealsChartData();

  const config: AreaConfig = {
    data,
    xField: "timeText",
    yField: "value",
    isStack: false,
    seriesField: "state",
    animation: true,
    startOnZero: false,
    smooth: true,
    legend: {
      offsetY: -6,
    },
    yAxis: {
      tickCount: 4,
      label: {
        formatter: (v: string) => {
          return `$${Number(v) / 1000}k`;
        },
      },
    },
    tooltip: {
      formatter: (data) => {
        return {
          name: data.state,
          value: `$${Number(data.value) / 1000}k`,
        };
      },
    },
  };

  const renderContent = () => {
    if (isError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Failed to load deals insights"
          description={error?.message || "Please try again."}
        />
      );
    }

    if (isEmpty) {
      return <Empty description="No deals data to display yet." />;
    }

    return <Area {...config} height={325} />;
  };

  return (
    <Card
      loading={isLoading}
      style={{ height: "100%" }}
      headStyle={{ padding: "8px 16px" }}
      bodyStyle={{ padding: "24px 24px 0 24px" }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DollarOutlined />
          <Text size="sm" style={{ marginLeft: "0.5rem" }}>
            Deals
          </Text>
        </div>
      }
    >
      {!isLoading && renderContent()}
    </Card>
  );
};

export default DealsChart;

import {
  DashboardTotalCountCard,
  DealsChart,
  LatestActivities,
  UpcomingEvents,
} from "@/components";
import { useDashboardTotals } from "@/utilities/hooks";
import { Alert, Col, Empty, Row } from "antd";

export const Home = () => {
  const { totals, isLoading, isError, error, isEmpty } = useDashboardTotals();
  return (
    <div>
      {isError && (
        <Row gutter={[32, 32]}>
          <Col xs={24}>
            <Alert
              type="error"
              showIcon
              message="Failed to load dashboard totals"
              description={error?.message || "Please try again."}
            />
          </Col>
        </Row>
      )}
      {isEmpty && !isError && (
        <Row gutter={[32, 32]} style={{ marginBottom: "32px" }}>
          <Col xs={24}>
            <Empty description="No summary metrics available yet." />
          </Col>
        </Row>
      )}
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="companies"
            isLoading={isLoading}
            totalCount={totals.companies}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="contacts"
            isLoading={isLoading}
            totalCount={totals.contacts}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="deals"
            isLoading={isLoading}
            totalCount={totals.deals}
          />
        </Col>
      </Row>
      <Row gutter={[32, 32]} style={{ marginTop: "32px" }}>
        <Col xs={24} sm={24} xl={8} style={{ height: "460px" }}>
          <UpcomingEvents />
        </Col>
        <Col xs={24} sm={24} xl={16} style={{ height: "460px" }}>
          <DealsChart />
        </Col>
      </Row>
      <Row gutter={[32, 32]} style={{ marginTop: "32px" }}>
        <Col xs={24}>
          <LatestActivities />
        </Col>
      </Row>
    </div>
  );
};

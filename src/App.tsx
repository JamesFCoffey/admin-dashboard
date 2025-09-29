import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { authProvider, dataProvider, liveProvider } from "./providers";
import { Home, ForgotPassword, Login, Register, CompanyList } from "./routes";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import { resources } from "./config/resources";
import Create from "./routes/company/create";
import Edit from "./routes/company/edit";
import List from "./routes/tasks/list";
import TasksCreatePage from "./routes/tasks/create";
import TasksEditPage from "./routes/tasks/edit";
import ErrorBoundary from "./components/error-boundary";
import { appConfig } from "@/utilities/config";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";

function SessionRedirectGuard() {
  const { status } = useSession();

  if (status === "loading") {
    return null;
  }

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        element={
          <Authenticated
            key="authenticated-layout"
            fallback={<CatchAllNavigate to="/login" />}
          >
            <Layout>
              <Outlet />
            </Layout>
          </Authenticated>
        }
      >
        <Route index element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/companies">
          <Route index element={<CompanyList />} />
          <Route path="new" element={<Create />} />
          <Route path="edit/:id" element={<Edit />} />
        </Route>
        <Route
          path="/tasks"
          element={
            <List>
              <Outlet />
            </List>
          }
        >
          <Route path="list" element={<Navigate to="/tasks" replace />} />
          <Route path="new" element={<TasksCreatePage />} />
          <Route path="edit/:id" element={<TasksEditPage />} />
        </Route>
        <Route path="/tasks/list" element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  const liveMode = appConfig.featureFlags.realtime ? "manual" : "off";

  return (
    <ErrorBoundary>
      <SessionProvider>
        <BrowserRouter>
          <RefineKbarProvider>
            <AntdApp>
              <DevtoolsProvider>
                <Refine
                  dataProvider={dataProvider}
                  liveProvider={liveProvider}
                  notificationProvider={useNotificationProvider}
                  routerProvider={routerBindings}
              authProvider={authProvider}
              resources={resources}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "3WBx42-NyjdMK-Ig281S",
                liveMode,
              }}
            >
                  <SessionRedirectGuard />
                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler />
                </Refine>
                <DevtoolsPanel />
              </DevtoolsProvider>
            </AntdApp>
          </RefineKbarProvider>
        </BrowserRouter>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default App;

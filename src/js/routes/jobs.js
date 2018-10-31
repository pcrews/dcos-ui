/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import { IndexRoute, Redirect, Route } from "react-router";

import JobsOverview from "#PLUGINS/jobs/src/js/JobsOverview";
import TaskDetailsTab from "#PLUGINS/services/src/js/pages/task-details/TaskDetailsTab";
import TaskFileBrowser from "#PLUGINS/services/src/js/pages/task-details/TaskFileBrowser";
import TaskFileViewer from "#PLUGINS/services/src/js/pages/task-details/TaskFileViewer";
import TaskFilesTab from "#PLUGINS/services/src/js/pages/task-details/TaskFilesTab";
import TaskLogsContainer from "#PLUGINS/services/src/js/pages/task-details/TaskLogsContainer";
import JobDetailPageContainer from "#PLUGINS/jobs/src/js/JobDetailPageContainer";
import JobsTaskDetailPage from "#PLUGINS/jobs/src/js/pages/JobTaskDetailPage";
import JobsPage from "../pages/JobsPage";
import JobModel from "#PLUGINS/jobs/src/js/data/JobModel";
import { graphqlObservable } from "data-service";
import gql from "graphql-tag";

import GraphiQL from "graphiql";
import "graphiql/graphiql.css";

function GraphiQLWrapper() {
  // our graphql has no introspection currently, so we need to get the schema
  // we need to have some sort of "select" for this somewhere (we also got the repositories model)

  const schema = JobModel;
  // fetcher seems to be able to handle observables
  const fetcher = ({ query, variables }) => {
    const q = gql`
      ${query}
    `;

    return graphqlObservable(q, schema, variables);
  };

  return (
    <div id="isolator" style={{ width: "100%" }}>
      <GraphiQL
        defaultQuery={`{
            jobs(path: "") {
              path
              filteredCount
              totalCount
              nodes
            }
          }
      `}
        fetcher={fetcher}
        schema={schema}
      />
    </div>
  );
}

GraphiQLWrapper.routeConfig = {
  label: "GraphiQL",
  icon: <span>🚒</span>,
  matches: /^\/development/
};

const jobsRoutes = [
  {
    type: Redirect,
    from: "/jobs",
    to: "/jobs/overview"
  },
  {
    type: Route,
    component: GraphiQLWrapper,
    path: "jobs",
    category: "root",
    isInSidebar: true,
    children: [
      {
        type: Route,
        component: JobsOverview,
        path: "overview",
        children: [
          {
            type: Route,
            path: ":path"
          }
        ]
      },
      {
        type: Redirect,
        from: "/job/detail/:id",
        to: "/job/detail/:id/tasks"
      },
      {
        type: Route,
        component: JobDetailPageContainer,
        path: "detail/:id",
        children: [
          {
            type: Redirect,
            path: "/jobs/detail/:id/tasks/:taskID",
            to: "/jobs/detail/:id/tasks/:taskID/details"
          },
          {
            type: Route,
            path: "tasks/:taskID",
            component: JobsTaskDetailPage,
            hideHeaderNavigation: true,
            children: [
              {
                component: TaskDetailsTab,
                isTab: true,
                path: "details",
                title: "Details",
                type: Route
              },
              {
                hideHeaderNavigation: true,
                component: TaskFilesTab,
                isTab: true,
                path: "files",
                title: "Files",
                type: Route,
                children: [
                  {
                    component: TaskFileBrowser,
                    fileViewerRoutePath:
                      "/jobs/detail/:id/tasks/:taskID/files/view(/:filePath(/:innerPath))",
                    hideHeaderNavigation: true,
                    type: IndexRoute
                  },
                  {
                    component: TaskFileViewer,
                    hideHeaderNavigation: true,
                    path: "view(/:filePath(/:innerPath))",
                    type: Route
                  }
                ]
              },
              {
                component: TaskLogsContainer,
                hideHeaderNavigation: true,
                isTab: true,
                path: "logs",
                title: "Logs",
                type: Route,
                children: [
                  {
                    path: ":filePath",
                    type: Route
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

module.exports = jobsRoutes;

import React from "react";
import { Route, Redirect } from "react-router";
import GraphiQL from "graphiql";

class DevelopmentPage extends React.Component {
  render() {
    return this.props.children;
  }
}

DevelopmentPage.routeConfig = {
  label: "development",
  icon: <span>🚒</span>,
  matches: /^\/development/
};

function GraphiQLWrapper() {
  return (
    <div>
      <h1>Hello world</h1>
    </div>
  );
}

GraphiQLWrapper.routeConfig = {
  label: "GraphiQL",
  matches: /^\/development\/graphiql/
};

const settingsRoutes = [
  {
    type: Redirect,
    from: "/development",
    to: "/development/graphiql"
  },
  {
    type: Route,
    path: "development",
    component: DevelopmentPage,
    category: "system",
    isInSidebar: true,
    children: [
      {
        type: Route,
        path: "graphiql",
        component: GraphiQLWrapper
      }
    ]
  }
];

module.exports = settingsRoutes;

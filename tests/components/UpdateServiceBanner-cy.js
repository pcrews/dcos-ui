describe("Installed Packages Tab", function() {
  beforeEach(function() {
    cy.configureCluster({
      mesos: "1-task-healthy",
      upgradeUI: true
    }).visitUrl({ url: "/dashboard", logIn: true });
  });

  it("shows the banner", function() {
    cy.get(".bannerMessage").should("exist");
  });

  it("links to the catalog page from the Release Notes button", function() {
    cy.get(".button-link.button-primary")
      .contains("Release Notes")
      .click();
    cy.url().should("include", "/catalog/packages/dcos-ui");
  });

  it("dismisses the banner when the upgrade is complete", function() {
    cy.get(".button-link.button-primary")
      .contains("Start Update")
      .click();
    cy.get(".bannerMessage").should("not.exist");
  });

  it("dismisses the banner when user clicks dismiss", function() {
    cy.get(".bannerMessage")
      .closest("div[role='log']")
      .find("svg")
      .click();
    cy.get(".bannerMessage").should("not.exist");
  });
});

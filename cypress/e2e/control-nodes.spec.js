/* global expect */
/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing control nodes on port ${port}`, () => {
    it("should render general control nodes", () => {
      cy.visit(`${origin}/e2e/control-nodes/1`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });
      cy.get("@console.error").should("not.be.called");

      cy.expectMainContents([
        "Hello World",
        "1",
        ",",
        "2",
        ",",
        "Goodbye World",
      ]);
    });

    it("should render nested control nodes", () => {
      cy.visit(`${origin}/e2e/control-nodes/2`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });
      cy.get("@console.error").should("not.be.called");

      cy.expectMainContents([
        "Hello",
        "start:1",
        "a",
        "end:1",
        "start:2",
        "b",
        "c",
        "end:2",
        "Goodbye",
      ]);
    });

    it("should render control nodes with tpl with useBrick", () => {
      cy.visit(`${origin}/e2e/control-nodes/3`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });
      cy.get("@console.error").should("not.be.called");

      // `useBrick` will render asynchronously,
      // so wait for specific content rendered.
      cy.contains("X:2:2");
      cy.contains("Modal:2:0");

      cy.expectMainContents(["X:1:1X:1:2", "X:2:1X:2:2", "Refresh"]);

      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:1:0",
        "Modal:2:0",
      ]);

      cy.contains("Refresh").click();
      cy.contains("X:4:2");
      cy.contains("Modal:4:0");
      cy.expectMainContents(["X:3:1X:3:2", "X:4:1X:4:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:3:0",
        "Modal:4:0",
      ]);

      cy.contains("Refresh").click();
      cy.contains("X:6:2");
      cy.contains("Modal:6:0");
      cy.expectMainContents(["X:5:1X:5:2", "X:6:1X:6:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:5:0",
        "Modal:6:0",
      ]);
    });

    it("should render control nodes with tpl", () => {
      cy.visit(`${origin}/e2e/control-nodes/4`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });
      cy.get("@console.error").should("not.be.called");

      cy.expectMainContents(["X:1", "X:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:1",
        "Modal:2",
        "Modal:Goodbye",
      ]);

      cy.contains("Refresh").click();
      cy.expectMainContents(["X:3", "X:4", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:3",
        "Modal:4",
        "Modal:Goodbye",
      ]);

      cy.contains("Refresh").click();
      cy.expectMainContents(["X:5", "X:6", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:5",
        "Modal:6",
        "Modal:Goodbye",
      ]);
    });
  });
}

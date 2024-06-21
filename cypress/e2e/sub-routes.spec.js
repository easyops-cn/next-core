/// <reference types="Cypress" />
/* global expect */
for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing sub-routes incremental rendering on port ${port}`, () => {
    it("should render sub-routes", () => {
      cy.visit(`${origin}/e2e/sub-routes/1`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
          cy.spy(win.console, "info").as("console.info");
        },
      });

      cy.contains("Sub Route 1 [1]");

      const fixedContents = [
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go 6",
        "Go other",
      ];

      cy.expectMainContents([...fixedContents, "Sub Route 1 [1][i: 1] x: 1"]);

      cy.get("@console.info").should("be.calledWith", "Mounted Root");
      cy.get("@console.info").should("have.callCount", 1);

      // Incremental rendering
      cy.contains("Go 2").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([...fixedContents, "Sub Route 2 [2][i: 2] x: 2"]);

      cy.get("@console.info").should("be.calledWith", "Mounted 2");
      cy.get("@console.info").should("have.callCount", 2);

      // Empty sub-route
      cy.contains("Go 3").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2").should("not.exist");
      cy.expectMainContents([...fixedContents, ""]);

      cy.get("@console.info").should("be.calledWith", "Unmounted 2");
      cy.get("@console.info").should("have.callCount", 3);

      cy.get("@console.error").should("not.be.called");

      // Sub-route fails
      cy.contains("Go 4").click();
      cy.contains("SyntaxError");
      cy.expectMainContents([
        ...fixedContents,
        'SyntaxError: Unexpected token (1:4), in "<% CTX. %>"',
      ]);

      cy.get("@console.error").should("be.called");

      // Sub-route redirects
      cy.contains("Go 5").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([...fixedContents, "Sub Route 2 [2][i: 2] x: 2"]);

      // cy.get("@console.info").should("be.calledWith", "Mounted 2");
      cy.get("@console.info").should("have.callCount", 4);

      // Inner nested sub-route
      cy.contains("Go 2/x").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([...fixedContents, "Sub Route 2 [2][i: 2] x: 2X"]);

      cy.get("@console.info").should("be.calledWith", "Mounted X");
      cy.get("@console.info").should("have.callCount", 5);

      // Inner nested sub-route
      cy.contains("Go 2/y").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([...fixedContents, "Sub Route 2 [2][i: 2] x: 2Y"]);

      cy.get("@console.info").should("be.calledWith", "Unmounted X");
      cy.get("@console.info").should("be.calledWith", "Mounted Y");
      cy.get("@console.info").should("have.callCount", 7);

      cy.contains("Go 6").click();
      cy.contains("2/undefined");
      cy.expectMainContents([
        ...fixedContents,
        "Push query undefined, 1/undefined, 2/undefined",
      ]);
      cy.contains("Push query").click();
      cy.expectMainContents([
        ...fixedContents,
        "Push query test, 1/test, 2/test",
      ]);

      // Outside route
      cy.contains("Go other").click();
      cy.contains("Real Other Route");
      cy.contains("Hello").should("not.exist");

      cy.get("@console.info").should("be.calledWith", "Unmounted Y");
      cy.get("@console.info").should("be.calledWith", "Unmounted 2");
      cy.get("@console.info").should("be.calledWith", "Unmounted Root");
      cy.get("@console.info").should("have.callCount", 10);
    });

    it("should render multiple sub-routes", () => {
      cy.visit(`${origin}/e2e/sub-routes-alt`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
          cy.spy(win.console, "info").as("console.info");
        },
      });

      cy.contains("Sub-Routes Alt");

      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "",
        "",
      ]);

      // Incremental rendering
      cy.contains("Go App").click();
      cy.contains("This is App");
      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "This is App",
        "",
      ]);

      cy.get("@console.info").should("be.calledWith", "Mounted App");
      cy.get("@console.info").should("have.callCount", 1);

      // Incremental rendering
      cy.contains("Go Host").click();
      cy.contains("This is Host");
      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "",
        "This is Host",
      ]);

      cy.get("@console.info").should("be.calledWith", "Mounted Host");
      cy.get("@console.info").should("be.calledWith", "Unmounted App");
      cy.get("@console.info").should("have.callCount", 3);

      cy.contains("Back Home").click();
      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "",
        "",
      ]);

      cy.get("@console.info").should("have.callCount", 4);
      cy.get("@console.info").should((spy) => {
        const call3 = spy.getCall(3);
        expect(call3.args[0]).to.equal("Unmounted Host");
      });

      // Incremental rendering
      cy.contains("Go Host").click();
      cy.contains("This is Host");
      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "",
        "This is Host",
      ]);

      cy.get("@console.info").should("have.callCount", 5);
      cy.get("@console.info").should((spy) => {
        const call4 = spy.getCall(4);
        expect(call4.args[0]).to.equal("Mounted Host");
      });

      // Incremental rendering
      cy.contains("Go App").click();
      cy.contains("This is App");
      cy.expectMainContents([
        "Sub-Routes Alt",
        "Go App",
        "Go Host",
        "Back Home",
        "This is App",
        "",
      ]);

      cy.get("@console.info").should("have.callCount", 7);
      cy.get("@console.info").should((spy) => {
        const call5 = spy.getCall(5);
        expect(call5.args[0]).to.equal("Unmounted Host");
        const call6 = spy.getCall(6);
        expect(call6.args[0]).to.equal("Mounted App");
      });
    });
  });
}

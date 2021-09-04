/// <reference types="Cypress" />

describe("Mocked homepage", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("GET", "/next/api/gateway/testService/testApiTwo", {
      statusCode: 200,
      body: {
        quality: "good",
      },
    }).as("testApiTwo");

    let pollIndex = 0;
    cy.intercept("GET", "/next/api/gateway/testService/testApiPoll", (req) => {
      req.reply({
        statusCode: 200,
        body: {
          loaded: pollIndex > 0,
          quality: pollIndex > 0 ? "better" : undefined,
        },
      });
      pollIndex += 1;
    }).as("testApiPoll");
  });

  it("work", () => {
    cy.visit("/next/", {
      onBeforeLoad(win) {
        cy.spy(win.console, "error").as("console.error");
        cy.spy(win.console, "info").as("console.info");
      },
    });
    cy.get("basic-bricks\\.micro-view")
      .invoke("prop", "pageTitle")
      .should("eq", "Hello, world!");
    cy.get("basic-bricks\\.page-error").should("not.exist");
    cy.get("@console.error").should("not.be.called");
    cy.get("pre").invoke("text").should("eq", '"good"');

    cy.contains("Check My Todos").click();
    cy.get("@console.error").should("not.be.called");
    cy.get("@console.info").should("be.calledWith", "callback.progress", false);
    cy.get("@console.info").should("be.calledWith", "callback.progress", true);
    cy.get("@console.info").should("be.calledWith", "callback.success", true);
    cy.get("@console.info").should("be.calledWith", "callback.finally");
    cy.get("@console.info").should("have.callCount", 4);
    cy.get("pre").invoke("text").should("eq", '"better"');
  });
});

/// <reference types="Cypress" />

const port = Cypress.env("mainPort");
const origin = `http://localhost:${port}`;

describe(`404 page on port ${port}`, () => {
  beforeEach(() => {
    cy.login(origin);
  });

  it("show page not found", () => {
    cy.visit(`${origin}/next/not-existed`);
    cy.get("presentational-bricks\\.brick-result")
      .invoke("prop", "customTitle")
      .should(
        "eq",
        "App not found, maybe the URL is wrong or you don't have permission to access"
      );
  });
});

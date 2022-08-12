/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`404 page on port ${port}`, () => {
    beforeEach(() => {
      cy.login(origin);
    });

    it("show page not found", () => {
      cy.visit(`${origin}/next/not-existed`);
      cy.contains("basic-bricks\\.page-not-found", "/next/not-existed");
    });
  });
}

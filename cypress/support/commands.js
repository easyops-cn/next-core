/* global expect */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (origin) => {
  cy.request("POST", `${origin}/next/api/auth/login`, {
    username: "easyops",
    password: "easyops",
  });
});

Cypress.Commands.add("logout", (origin) => {
  cy.request("POST", `${origin}/next/api/auth/logout`);
});

Cypress.Commands.add("expectMainContents", (contents) => {
  cy.get("#main-mount-point > *").then((elements) => {
    const received = elements.map((i, el) => el.textContent).get();
    expect(received).to.deep.equal(contents);
  });
});

Cypress.Commands.add("expectPortalContents", (contents) => {
  cy.get("#portal-mount-point > *").then((elements) => {
    const received = elements.map((i, el) => el.textContent).get();
    expect(received).to.deep.equal(contents);
  });
});

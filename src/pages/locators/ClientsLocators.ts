/**
 * ClientsLocators — /admin/clients page + Add Client dialog.
 *
 * Rules:
 *  - No logic, no imports, no helper calls.
 *  - Priority: getByRole → getByLabel → getByText → getByTestId → CSS (last resort).
 *  - No XPath.
 *  - `as const` ensures full autocomplete and prevents accidental mutation.
 */
export const ClientsLocators = {
  // ── Clients list ───────────────────────────────────────────────────────────
  addButton:    { role: 'button'  as const, name: 'Add' },
  searchInput:  { role: 'textbox' as const, name: 'Search...' },
  clientLink:   (name: string) => ({ role: 'link' as const, name }),
  clientsGrid:  { role: 'treegrid' as const },

  // ── Add Client dialog ──────────────────────────────────────────────────────
  dialog:             { role: 'dialog'  as const, name: 'Add Client' },
  dialogHeading:      { role: 'heading' as const, name: 'Add Client', level: 2 },
  nextStepButton:     { role: 'button'  as const, name: 'Next Step' },

  // ── Step 1 — Client Details ────────────────────────────────────────────────
  clientTypeCombobox: { role: 'combobox' as const, name: 'Client Type' },

  // Required fields change based on Client Type
  firstNameInput:    { role: 'textbox' as const, name: '* First Name' },
  lastNameInput:     { role: 'textbox' as const, name: '* Last Name' },
  businessNameInput: { role: 'textbox' as const, name: '* Business Name' },
} as const;

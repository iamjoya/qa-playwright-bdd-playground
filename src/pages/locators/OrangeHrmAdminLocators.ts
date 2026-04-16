export const OrangeHrmAdminLocators = {
  addButton:             { role: 'button'  as const, name: 'Add' },
  saveButton:            { role: 'button'  as const, name: 'Save' },
  confirmDeleteButton:   { role: 'button'  as const, name: 'Yes, Delete' },

  // Dropdowns
  selectText:            '.oxd-select-text',
  dropdownOption:        (label: string) => `.oxd-select-option:has-text("${label}")`,

  // Form field scoping
  inputGroup:            '.oxd-input-group',
  autocompleteDropdown:  '.oxd-autocomplete-dropdown',
  autocompleteOption:    '.oxd-autocomplete-option',

  // User list search
  searchButton:          { role: 'button' as const, name: 'Search' },

  // Table rows
  tableRow:              (username: string) =>
    `.oxd-table-row:has(.oxd-table-cell:has-text("${username}"))`,
  rowCheckbox:           (username: string) =>
    `.oxd-table-row:has(.oxd-table-cell:has-text("${username}")) input[type="checkbox"]`,
  deleteButton:          { role: 'button' as const, name: 'Delete Selected' },

  requiredErrors:        '.oxd-input-field-error-message',
  duplicateError:        '.oxd-input-field-error-message:has-text("Already exists")',
} as const;

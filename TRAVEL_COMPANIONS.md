# DS-160: Travel Companions Information

This page is conditional. Selecting **Yes** for other persons traveling with
you reveals a group/organization question, which then branches again. The test
fixture uses invented data only and must never be submitted as a real
application.

## Base question

- **Are there other persons traveling with you?** `YES` or `NO`
  (`rblOtherPersonsTravelingWithYou`). Test: `NO`.

## Conditional: other persons = YES

Reveals:

- **Are you traveling as part of a group or organization?** `YES` or `NO`
  (`rblGroupTravel`).

### Group = YES

- **Group Name:** free text (`tbxGroupName`).

### Group = NO

Companion fields (`dlTravelCompanions_ctl00_*`):

- **Surnames** (`tbxSurname`)
- **Given Names** (`tbxGivenName`)
- **Relationship** (`ddlTCRelationship`): `P` Parent, `S` Spouse, `C` Child,
  `R` Other Relative, `F` Friend, `B` Business Associate, `O` Other

## Test data

[`fixtures/travel-companions.test.json`](fixtures/travel-companions.test.json)
defaults to traveling alone (`otherPersonsTravelingWithYou: "NO"`).

Live inventories:

- `data/travel-companions.fields.json`
- `data/travel-companions.yes.fields.json`
- `data/travel-companions.group-yes.fields.json`
- `data/travel-companions.group-no.fields.json`

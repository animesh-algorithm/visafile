# Travel Information Form

## Actual Fields (from field inventory)

### Purpose of Trip to the U.S. (Visa Class)
- **Field**: `ddlPurposeOfTrip` (dropdown)
- **Available Visa Classes**:
  - `A` - FOREIGN GOVERNMENT OFFICIAL
  - `B` - TEMP. BUSINESS OR PLEASURE VISITOR (most common for tourism/business)
  - `C` - ALIEN IN TRANSIT
  - `CNMI` - CNMI WORKER OR INVESTOR
  - `D` - CREWMEMBER
  - `E` - TREATY TRADER OR INVESTOR
  - `F` - ACADEMIC OR LANGUAGE STUDENT
  - `G` - INTERNATIONAL ORGANIZATION REP./EMP.
  - `H` - TEMPORARY WORKER
  - `I` - FOREIGN MEDIA REPRESENTATIVE
  - `J` - EXCHANGE VISITOR
  - `K` - FIANCÉ(E) OR SPOUSE OF A U.S. CITIZEN
  - `L` - INTRACOMPANY TRANSFEREE
  - `M` - VOCATIONAL/NONACADEMIC STUDENT
  - `N` - OTHER
  - `NATO` - NATO STAFF
  - `O` - ALIEN WITH EXTRAORDINARY ABILITY
  - `P` - INTERNATIONALLY RECOGNIZED ALIEN
  - `Q` - CULTURAL EXCHANGE VISITOR
  - `R` - RELIGIOUS WORKER
  - `S` - INFORMANT OR WITNESS
  - `T` - VICTIM OF TRAFFICKING
  - `TD/TN` - NAFTA PROFESSIONAL
  - `U` - VICTIM OF CRIMINAL ACTIVITY
  - `PAROLE-BEN` - PAROLE BENEFICIARY

### Do you have specific travel plans?
- **Field**: `rblSpecificTravel` (radio button)
- **Values**: YES / NO

### Person/Entity Paying for Your Trip
- **Field**: `ddlWhoIsPaying` (dropdown)
- **Available Options**:
  - `S` - Self
  - `H` - U.S. Petitioner
  - `O` - Other Person
  - `P` - Present Employer
  - `U` - Employer in the U.S.
  - `C` - Other Company/Organization

## Test Data

Updated test data file at `fixtures/travel-information.test.json`:

```json
{
  "purposeOfTrip": "B",
  "hasSpecificTravelPlans": "NO",
  "payingForTrip": "S"
}
```

**Explanation:**
- `"B"` = Temporary Business or Pleasure Visitor (B-1/B-2 visa - tourism/business)
- `"NO"` = No specific travel plans yet
- `"S"` = Self-funded trip

## Implementation Status

✅ Field inventory captured successfully
✅ Actual field IDs identified
✅ Test data updated with correct values
✅ `fillTravelInformation()` function simplified
✅ Ready to proceed to Travel Companions

## Next Steps

Run the automation again:
```bash
npm start
```

The script will now:
1. Fill Travel Information with correct values
2. Click "Next: Travel Companions"
3. Stop at Travel Companions page

## Notes

- The Travel Information form is simpler than expected
- It only asks for visa class, specific travel plans (yes/no), and who's paying
- Additional details (dates, addresses, etc.) may appear on subsequent pages
- The most common visa for tourism/business is **B (Temp. Business or Pleasure Visitor)**

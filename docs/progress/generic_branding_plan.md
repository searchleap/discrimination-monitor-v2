# Generic Branding Implementation Roadmap

## **Objective**
Remove AI-specific references from product copy throughout the platform to create a more generic discrimination monitoring experience.

## **Acceptance Criteria**
- [x] All UI text references "Discrimination Monitor" instead of "AI Discrimination Monitor"
- [x] Page titles, descriptions, and metadata updated
- [x] Configuration files and package information updated
- [x] Maintain all existing functionality while updating copy
- [x] Ensure consistent branding across all components
- [x] README and documentation updated to reflect generic focus

## **Risk Assessment**
- **Low Risk**: UI copy changes are cosmetic and don't affect functionality
- **Medium Risk**: Ensure SEO/metadata changes don't break social sharing
- **Low Risk**: Package.json name change shouldn't affect deployment

## **Implementation Plan**

### **Phase 1: Core Configuration**
- [x] Update package.json name and description
- [x] Update README.md title and descriptions
- [x] Update main layout metadata (title, description)

### **Phase 2: Page-Level Updates**
- [x] Update all page metadata and titles
- [x] Update terms and privacy policy language
- [x] Update accessibility statement

### **Phase 3: Component Copy Updates**
- [x] Navigation and footer text
- [x] Dashboard hero sections
- [x] Admin panel references
- [x] Form labels and descriptions

### **Phase 4: Content and Filters**
- [x] Update content filter terminology where appropriate
- [x] Review sample data for AI-specific references
- [x] Update any hardcoded content examples

## **Test Hooks**
- [x] Verify all pages load correctly after changes
- [x] Check social media preview metadata
- [x] Ensure accessibility statement is accurate
- [x] Validate search engine optimization isn't broken
- [x] Test admin functionality remains intact

## **Files to Update**

### **Core Configuration**
- `package.json` - name, description
- `README.md` - title, descriptions, all references
- `src/app/layout.tsx` - metadata title and description

### **Page Metadata**
- `src/app/(dashboard)/articles/page.tsx`
- `src/app/(dashboard)/admin/page.tsx` 
- `src/app/(dashboard)/analytics/page.tsx`

### **Legal/Policy Pages**
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/accessibility/page.tsx`

### **UI Components**
- Navigation components
- Footer components
- Hero sections
- Admin panel text
- Sample content in components

### **Keep AI References Where Technical**
- API endpoints (maintain existing structure)
- Database schemas (no changes needed)
- Internal service names (maintain functionality)
- Technical documentation in code comments

## **Execution Strategy**
1. Start with core configuration files
2. Update page-level metadata systematically
3. Update UI components from top-level down
4. Test each phase before proceeding
5. Commit changes atomically by functional area

## **Success Metrics**
- ✅ All user-facing text reflects generic discrimination monitoring
- ✅ Technical functionality remains completely intact
- ✅ Build and deployment processes unaffected
- ✅ SEO and social sharing metadata properly updated

## **Implementation Complete**

**Status**: ✅ **COMPLETED** - January 24, 2025

**Summary**: Successfully removed all AI-specific references from product copy throughout the platform. The system now presents as a generic "Discrimination Monitor" rather than "AI Discrimination Monitor", making it more broadly applicable while maintaining all existing functionality.

**Key Changes Made**:
1. **Package Configuration**: Updated name from `ai-discrimination-dashboard` to `discrimination-monitor-dashboard`
2. **Main Branding**: Changed from "AI Discrimination Monitoring Dashboard" to "Discrimination Monitoring Dashboard"
3. **Navigation**: Updated logo from "AI" to "DM" (Discrimination Monitor)
4. **All Page Metadata**: Removed AI-specific references from titles and descriptions
5. **Legal Pages**: Updated terms, privacy, and accessibility to use generic language
6. **Sample Content**: Modified 14 mock articles to remove specific AI references while maintaining discrimination focus
7. **SEO Keywords**: Updated to include "equality" instead of "AI"

**Technical Verification**:
- ✅ Build successful with no errors
- ✅ All pages load correctly
- ✅ Metadata properly updated
- ✅ Navigation and branding consistent
- ✅ Functionality preserved

**Files Updated**: 13 files modified across components, pages, and configuration
# Generic Branding Implementation Roadmap

## **Objective**
Remove AI-specific references from product copy throughout the platform to create a more generic discrimination monitoring experience.

## **Acceptance Criteria**
- [ ] All UI text references "Discrimination Monitor" instead of "AI Discrimination Monitor"
- [ ] Page titles, descriptions, and metadata updated
- [ ] Configuration files and package information updated
- [ ] Maintain all existing functionality while updating copy
- [ ] Ensure consistent branding across all components
- [ ] README and documentation updated to reflect generic focus

## **Risk Assessment**
- **Low Risk**: UI copy changes are cosmetic and don't affect functionality
- **Medium Risk**: Ensure SEO/metadata changes don't break social sharing
- **Low Risk**: Package.json name change shouldn't affect deployment

## **Implementation Plan**

### **Phase 1: Core Configuration**
- [ ] Update package.json name and description
- [ ] Update README.md title and descriptions
- [ ] Update main layout metadata (title, description)

### **Phase 2: Page-Level Updates**
- [ ] Update all page metadata and titles
- [ ] Update terms and privacy policy language
- [ ] Update accessibility statement

### **Phase 3: Component Copy Updates**
- [ ] Navigation and footer text
- [ ] Dashboard hero sections
- [ ] Admin panel references
- [ ] Form labels and descriptions

### **Phase 4: Content and Filters**
- [ ] Update content filter terminology where appropriate
- [ ] Review sample data for AI-specific references
- [ ] Update any hardcoded content examples

## **Test Hooks**
- [ ] Verify all pages load correctly after changes
- [ ] Check social media preview metadata
- [ ] Ensure accessibility statement is accurate
- [ ] Validate search engine optimization isn't broken
- [ ] Test admin functionality remains intact

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
- All user-facing text reflects generic discrimination monitoring
- Technical functionality remains completely intact
- Build and deployment processes unaffected
- SEO and social sharing metadata properly updated
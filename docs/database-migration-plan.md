# Database Migration Plan: Team Challenges Gamification

## Overview
This document outlines the plan for migrating the database to support the new team challenges gamification feature. The migration will add new tables and relationships while preserving existing data.

## Current State
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Current Schema**: Supports basic team functionality, quests, and user management
- **New Features**: Team challenges, recognition system, progress tracking, media uploads

## Migration Strategy

### 1. Pre-Migration Checklist

#### Environment Setup
- [ ] Ensure all team members are aware of the migration
- [ ] Schedule maintenance window if needed
- [ ] Backup production database
- [ ] Test migration on staging environment first
- [ ] Verify all API tests pass with new schema

#### Code Deployment
- [ ] Deploy API changes first (new routes and services)
- [ ] Deploy frontend changes (new UI components)
- [ ] Ensure backward compatibility during transition

### 2. New Database Models to Add

#### Core Models
1. **TeamChallenge** - Main challenge entity
   - Challenge metadata (title, description, type, duration)
   - Team relationships
   - Status tracking (active, completed, cancelled)

2. **TeamChallengeParticipant** - Challenge participation
   - Links users to challenges
   - Tracks participation status
   - Stores individual progress

3. **TeamRecognition** - Recognition system
   - Recognition metadata (type, message, media)
   - Sender and recipient relationships
   - Timestamps and status

4. **UserRecognitionLimit** - Rate limiting
   - Daily/weekly recognition limits
   - Prevents spam and abuse

5. **RecognitionInteraction** - Social interactions
   - Claps, reactions, comments
   - User engagement tracking

6. **ChallengeProgress** - Progress tracking
   - Real-time progress updates
   - Milestone tracking
   - Performance metrics

7. **ChallengeMilestone** - Milestone system
   - Sub-goals within challenges
   - Automated notifications
   - Progress validation

### 3. Migration Steps

#### Step 1: Create Migration File
```bash
cd smartfyt-api
npx prisma migrate dev --name add_team_challenges_gamification
```

#### Step 2: Review Generated Migration
- Check the generated SQL in `prisma/migrations/`
- Verify all tables and relationships are correct
- Ensure indexes are properly created
- Review foreign key constraints

#### Step 3: Test Migration Locally
```bash
# Reset local database
npx prisma migrate reset

# Apply migration
npx prisma migrate deploy

# Verify schema
npx prisma generate

# Run tests
npm test
```

#### Step 4: Staging Deployment
1. Deploy to staging environment
2. Run migration on staging database
3. Test all new functionality
4. Verify existing features still work
5. Load test with realistic data

#### Step 5: Production Deployment
1. **Backup Production Database**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Deploy API Changes**
   - Deploy new code to production
   - Ensure new routes are available

3. **Run Migration**
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify Migration**
   - Check all tables exist
   - Verify relationships
   - Test critical functionality

### 4. Data Migration Considerations

#### Existing Data
- No existing data needs to be migrated
- New tables start empty
- Existing user and team data remains unchanged

#### Seed Data (Optional)
- Use `scripts/seed-team-challenges.js` for testing
- Create sample challenges and recognitions
- Test with realistic data volumes

### 5. Rollback Plan

#### If Migration Fails
1. **Immediate Rollback**
   ```bash
   # Revert to previous migration
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

2. **Code Rollback**
   - Revert API deployment
   - Revert frontend deployment
   - Restore from backup if needed

#### Rollback Triggers
- Database errors during migration
- API functionality breaks
- Performance degradation
- Data integrity issues

### 6. Post-Migration Tasks

#### Verification
- [ ] All new API endpoints work
- [ ] Frontend can create/view challenges
- [ ] Recognition system functions
- [ ] Progress tracking works
- [ ] Media uploads succeed
- [ ] Notifications are sent

#### Monitoring
- [ ] Database performance
- [ ] API response times
- [ ] Error rates
- [ ] User engagement metrics

#### Documentation
- [ ] Update API documentation
- [ ] Update database schema docs
- [ ] Create user guides
- [ ] Document new features

### 7. Risk Assessment

#### Low Risk
- Adding new tables doesn't affect existing data
- New functionality is isolated
- Backward compatibility maintained

#### Medium Risk
- Database performance with new tables
- API response times with new queries
- Complex relationships and constraints

#### Mitigation Strategies
- Test with realistic data volumes
- Monitor performance metrics
- Have rollback plan ready
- Deploy during low-traffic periods

### 8. Timeline

#### Phase 1: Preparation (1-2 days)
- [ ] Finalize schema review
- [ ] Complete testing
- [ ] Prepare deployment scripts
- [ ] Schedule maintenance window

#### Phase 2: Staging (1 day)
- [ ] Deploy to staging
- [ ] Run migration
- [ ] Comprehensive testing
- [ ] Performance validation

#### Phase 3: Production (1 day)
- [ ] Deploy to production
- [ ] Run migration
- [ ] Verification testing
- [ ] Monitor for issues

### 9. Success Criteria

#### Technical
- [ ] All migrations complete successfully
- [ ] No data loss or corruption
- [ ] All tests pass
- [ ] Performance within acceptable limits

#### Functional
- [ ] Users can create team challenges
- [ ] Recognition system works
- [ ] Progress tracking functions
- [ ] Media uploads succeed
- [ ] Notifications are delivered

#### Business
- [ ] Feature adoption metrics
- [ ] User engagement increases
- [ ] No support tickets related to migration
- [ ] System stability maintained

## Next Steps

1. **Review this plan** with the team
2. **Schedule migration window**
3. **Prepare staging environment**
4. **Execute migration steps**
5. **Monitor and verify**

## Contact Information

- **Database Admin**: [Name]
- **Backend Lead**: [Name]
- **DevOps**: [Name]
- **Emergency Contact**: [Name]

---

**Last Updated**: January 15, 2025
**Version**: 1.0
**Status**: Ready for Review 
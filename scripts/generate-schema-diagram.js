import fs from 'fs';
import path from 'path';

// Model categories for better organization
const modelCategories = {
  core: ['User', 'Team', 'School', 'Sport'],
  gamification: ['TeamChallenge', 'TeamChallengeParticipant', 'TeamRecognition', 'UserRecognitionLimit', 'Quest', 'QuestCategory', 'UserQuest', 'UserStat'],
  health: ['DailyHealthSummary', 'ActivityDetail', 'SleepDetail', 'BodyMetrics', 'Activity', 'Sleep', 'HeartRateZone'],
  payment: ['Subscription', 'SubscriptionPlan'],
  terra: ['terra_users', 'terra_data_payloads', 'terra_misc_payloads'],
  communication: ['Journal', 'TeamPost', 'TeamNotes', 'Notification', 'ChatSession', 'ChatMessage', 'ContactInquiry'],
  user: ['UserForm', 'UserPerformanceMetrics', 'UserStreak', 'MorningJournal', 'TeamMembership']
};

// Category colors
const categoryColors = {
  core: '#dc2626',
  gamification: '#0891b2',
  health: '#ea580c',
  payment: '#16a34a',
  terra: '#9333ea',
  communication: '#059669',
  user: '#7c3aed'
};

function getModelCategory(modelName) {
  for (const [category, models] of Object.entries(modelCategories)) {
    if (models.includes(modelName)) {
      return category;
    }
  }
  return 'other';
}

function parseRelationAttribute(line) {
  const relationMatch = line.match(/@relation\(([^)]+)\)/);
  if (!relationMatch) return null;
  
  const relationContent = relationMatch[1];
  
  // Parse fields and references
  const fieldsMatch = relationContent.match(/fields:\s*\[([^\]]+)\]/);
  const referencesMatch = relationContent.match(/references:\s*\[([^\]]+)\]/);
  const relationNameMatch = relationContent.match(/"([^"]+)"/);
  
  return {
    fields: fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : [],
    references: referencesMatch ? referencesMatch[1].split(',').map(f => f.trim()) : [],
    relationName: relationNameMatch ? relationNameMatch[1] : null
  };
}

function parsePrismaSchema(schemaPath) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const models = [];
  
  // Split by model blocks
  const modelBlocks = schemaContent.split('model ').slice(1);
  
  modelBlocks.forEach(block => {
    const lines = block.split('\n');
    const modelName = lines[0].trim().split(' ')[0];
    
    if (modelName && !modelName.startsWith('//')) {
      const fields = [];
      let inModel = false;
      let braceCount = 0;
      
      // Check if the first line contains the opening brace
      const firstLine = lines[0].trim();
      if (firstLine.includes('{')) {
        inModel = true;
        braceCount = 1;
      }
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '{') {
          inModel = true;
          braceCount++;
          continue;
        }
        
        if (line === '}') {
          braceCount--;
          if (braceCount === 0) {
            break;
          }
          continue;
        }
        
        if (inModel && line && !line.startsWith('//') && !line.startsWith('@@')) {
          // Split by whitespace and extract field info
          const parts = line.split(/\s+/).filter(part => part.length > 0);
          
          if (parts.length >= 2) {
            const fieldName = parts[0];
            let fieldType = parts[1];
            let isOptional = false;
            
            // Check if field type ends with ? (optional)
            if (fieldType.endsWith('?')) {
              isOptional = true;
              fieldType = fieldType.slice(0, -1);
            }
            
            // Check for common attributes
            const isId = line.includes('@id');
            const isForeign = line.includes('@relation');
            const hasDefault = line.includes('@default');
            const hasUpdatedAt = line.includes('@updatedAt');
            const hasUnique = line.includes('@unique');
            
            // Extract default value if present
            let defaultValue = null;
            const defaultMatch = line.match(/@default\(([^)]+)\)/);
            if (defaultMatch) {
              defaultValue = defaultMatch[1];
            }
            
            // Extract database type if present
            let dbType = null;
            const dbMatch = line.match(/@db\.(\w+)/);
            if (dbMatch) {
              dbType = dbMatch[1];
            }
            
            // Parse relation details
            let relation = null;
            if (isForeign) {
              relation = parseRelationAttribute(line);
            }
            
            fields.push({
              name: fieldName,
              type: fieldType,
              isId,
              isOptional: isOptional,
              isForeign,
              hasDefault,
              hasUpdatedAt,
              hasUnique,
              defaultValue,
              dbType,
              relation
            });
          }
        }
      }
      
      models.push({
        name: modelName,
        fields,
        relationFields: fields.filter(f => f.isForeign)
      });
    }
  });
  
  return models;
}

function generateModelCard(model, fields, allModels) {
  const category = getModelCategory(model.name);
  const color = categoryColors[category] || '#6b7280';
  
  // Show only first 5 fields in collapsed state (cards are now 500px tall for better content fit)
  const visibleFields = fields.slice(0, 5);
  const hiddenFields = fields.slice(5);
  const hasHiddenFields = hiddenFields.length > 0;
  
  const fieldHtml = visibleFields.map(field => {
    const isPrimary = field.isId;
    const isForeign = field.isForeign;
    const isOptional = field.isOptional;
    
    let fieldClass = 'field-type';
    if (isPrimary) fieldClass += ' field-primary';
    if (isForeign) fieldClass += ' field-foreign';
    if (isOptional) fieldClass += ' field-optional';
    
    let typeDisplay = field.type;
    if (field.dbType) {
      typeDisplay += ` @db.${field.dbType}`;
    }
    if (field.defaultValue) {
      typeDisplay += ` @default(${field.defaultValue})`;
    }
    if (field.hasUpdatedAt) {
      typeDisplay += ' @updatedAt';
    }
    if (field.hasUnique) {
      typeDisplay += ' @unique';
    }
    if (isOptional) {
      typeDisplay += '?';
    }
    
    return `
                        <div class="field${isOptional ? ' field-optional' : ''}">
                            <span class="field-name">${field.name}</span>
                            <span class="${fieldClass}">${typeDisplay}</span>
                        </div>`;
  }).join('');

  // Generate hidden fields HTML
  const hiddenFieldsHtml = hiddenFields.map(field => {
    const isPrimary = field.isId;
    const isForeign = field.isForeign;
    const isOptional = field.isOptional;
    
    let fieldClass = 'field-type';
    if (isPrimary) fieldClass += ' field-primary';
    if (isForeign) fieldClass += ' field-foreign';
    if (isOptional) fieldClass += ' field-optional';
    
    let typeDisplay = field.type;
    if (field.dbType) {
      typeDisplay += ` @db.${field.dbType}`;
    }
    if (field.defaultValue) {
      typeDisplay += ` @default(${field.defaultValue})`;
    }
    if (field.hasUpdatedAt) {
      typeDisplay += ' @updatedAt';
    }
    if (field.hasUnique) {
      typeDisplay += ' @unique';
    }
    if (isOptional) {
      typeDisplay += '?';
    }
    
    return `
                        <div class="field hidden-field${isOptional ? ' field-optional' : ''}">
                            <span class="field-name">${field.name}</span>
                            <span class="${fieldClass}">${typeDisplay}</span>
                        </div>`;
  }).join('');

  // Generate relationship details
  const relationships = [];
  fields.forEach(field => {
    if (field.isForeign && field.relation) {
      const targetModel = field.type.replace('[]', '').replace('?', '');
      const relationInfo = {
        field: field.name,
        targetModel,
        targetField: field.relation.references[0] || 'id',
        relationName: field.relation.relationName,
        isArray: field.type.includes('[]'),
        isOptional: field.type.includes('?')
      };
      relationships.push(relationInfo);
    }
  });

  const relationshipHtml = relationships.map(rel => {
    const arrow = rel.isArray ? '→' : '→';
    const optional = rel.isOptional ? '?' : '';
    const relationText = rel.relationName ? ` (${rel.relationName})` : '';
    return `
                            <div class="relationship-item">
                                <span class="relationship-field">${rel.field}</span>
                                <span class="relationship-arrow">${arrow}</span>
                                <span class="relationship-target">${rel.targetModel}.${rel.targetField}${optional}${relationText}</span>
                            </div>`;
  }).join('');

  const clickableClass = hasHiddenFields ? 'clickable' : '';
  
  // Create separator with expand indicator
  const separatorHtml = hasHiddenFields ? `
                        <div class="separator-with-indicator">
                            <div class="separator-line"></div>
                            <div class="expand-indicator">
                                <span class="expand-dots">•••</span>
                                <span class="expand-text">${hiddenFields.length} more fields</span>
                                <span class="expand-dots">•••</span>
                            </div>
                            <div class="separator-line"></div>
                        </div>` : `
                        <div class="separator-line"></div>`;

  return `
                    <div class="model-card ${clickableClass}" data-category="${category}" id="card-${model.name}" onclick="toggleCard('${model.name}')">
                        <div class="category-tag category-${category}" style="background: ${color};">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                        <div class="model-name">${model.name}</div>
                        <div class="fields-container">
                            ${fieldHtml}
                            ${hiddenFieldsHtml}
                        </div>
                        ${separatorHtml}
                        <div class="relationships">
                            <div class="relationship-header"><strong>Relationships:</strong> ${relationships.length} connections</div>
                            ${relationshipHtml}
                        </div>
                    </div>`;
}

function generateFilterButtons(categoryCounts) {
  const categories = Object.keys(categoryCounts);
  return categories.map(category => {
    const count = categoryCounts[category];
    const color = categoryColors[category] || '#6b7280';
    return `
                <button class="filter-btn active" data-category="${category}" style="border-color: ${color};">
                    <span class="filter-btn-text">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span class="filter-btn-count">${count}</span>
                </button>`;
  }).join('');
}

function generateHtml(models) {
  const modelCards = models.map(model => generateModelCard(model, model.fields, models)).join('');
  
  // Count models by category for filter buttons
  const categoryCounts = {};
  models.forEach(model => {
    const category = getModelCategory(model.name);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  const filterButtons = generateFilterButtons(categoryCounts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFyt Database Schema Diagram</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 1.8rem;
            color: #374151;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e5e7eb;
        }

        .filters {
            margin-bottom: 30px;
            text-align: center;
        }

        .filter-btn {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 25px;
            padding: 8px 16px;
            margin: 0 8px 8px 0;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .filter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .filter-btn.active {
            background: #f8fafc;
            border-width: 3px;
        }

        .filter-btn-text {
            color: #374151;
        }

        .filter-btn-count {
            background: #e5e7eb;
            color: #6b7280;
            border-radius: 12px;
            padding: 2px 8px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .filter-btn.active .filter-btn-count {
            background: #4f46e5;
            color: white;
        }

        .models-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .model-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            height: 500px;
            overflow: hidden;
            position: relative;
        }

        .model-card.clickable {
            cursor: pointer;
        }

        .model-card.clickable:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-color: #4f46e5;
        }

        .model-card.expanded {
            height: auto;
            max-height: 1000px;
        }

        .model-card.hidden {
            display: none;
        }

        .model-name {
            font-size: 1.3rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #d1d5db;
        }

        .fields-container {
            max-height: 280px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .model-card.expanded .fields-container {
            max-height: none;
        }

        .field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .field:last-child {
            border-bottom: none;
        }

        .field-name {
            font-weight: 500;
            color: #374151;
        }

        .field-type {
            font-family: 'Courier New', monospace;
            background: #e5e7eb;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #6b7280;
            max-width: 60%;
            word-break: break-all;
        }

        .field-primary {
            background: #fef3c7;
            color: #92400e;
        }

        .field-foreign {
            background: #dbeafe;
            color: #1e40af;
        }

        .field-optional {
            opacity: 0.6;
        }

        .hidden-field {
            display: none;
        }

        .model-card.expanded .hidden-field {
            display: flex;
        }

        .relationships {
            margin-top: 15px;
            padding-top: 15px;
            max-height: 150px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .model-card.expanded .relationships {
            max-height: none;
        }

        .separator-with-indicator {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 0 10px;
        }

        .separator-line {
            flex-grow: 1;
            height: 1px;
            background: #e5e7eb;
        }

        .expand-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
            color: #6b7280;
            font-style: italic;
            padding: 0 10px;
        }

        .expand-dots {
            font-family: 'Courier New', monospace;
            font-size: 0.7rem;
        }

        .model-card.expanded .expand-indicator {
            display: none;
        }

        .relationship-header {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 500;
        }

        .relationship-header strong {
            color: #4f46e5;
        }

        .relationship-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8rem;
            color: #6b7280;
            margin-bottom: 4px;
            padding: 4px 8px;
            background: #f1f5f9;
            border-radius: 4px;
        }

        .relationship-field {
            font-weight: 500;
            color: #374151;
        }

        .relationship-arrow {
            color: #4f46e5;
            font-weight: bold;
        }

        .relationship-target {
            font-family: 'Courier New', monospace;
            color: #059669;
        }

        .legend {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .legend h3 {
            color: #374151;
            margin-bottom: 15px;
        }

        .legend-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }

        .legend-text {
            font-size: 0.9rem;
            color: #6b7280;
        }

        .category-tag {
            display: inline-block;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 10px;
        }

        .separator-with-indicator {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 0 10px;
        }

        .separator-line {
            flex-grow: 1;
            height: 1px;
            background: #e5e7eb;
        }

        .expand-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
            color: #6b7280;
            font-style: italic;
        }

        .expand-dots {
            font-family: 'Courier New', monospace;
            font-size: 0.7rem;
        }

        @media (max-width: 1200px) {
            .models-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .models-grid {
                grid-template-columns: 1fr;
            }
            
            .stats {
                flex-direction: column;
                gap: 20px;
            }
            
            .filter-btn {
                margin: 0 4px 8px 0;
                padding: 6px 12px;
                font-size: 0.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SmartFyt Database Schema</h1>
            <p>Updated database structure with ${models.length} models and relationships</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">${models.length}</span>
                    <span class="stat-label">Models</span>
                </div>
                <div class="stat">
                    <span class="stat-number">PostgreSQL</span>
                    <span class="stat-label">Database</span>
                </div>
            </div>
        </div>

        <div class="content">
            <div class="legend">
                <h3>Legend</h3>
                <div class="legend-items">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #fef3c7;"></div>
                        <span class="legend-text">Primary Key</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #dbeafe;"></div>
                        <span class="legend-text">Foreign Key</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #e5e7eb;"></div>
                        <span class="legend-text">Regular Field</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #f3f4f6; opacity: 0.6;"></div>
                        <span class="legend-text">Optional Field</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">All Models</h2>
                <div class="filters">
                    ${filterButtons}
                </div>
                <div class="models-grid">
                    ${modelCards}
                </div>
            </div>
        </div>
    </div>

    <script>
        // Filter functionality
        document.addEventListener('DOMContentLoaded', function() {
            const filterButtons = document.querySelectorAll('.filter-btn');
            const modelCards = document.querySelectorAll('.model-card');
            
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const category = this.getAttribute('data-category');
                    
                    // Toggle active state
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show/hide model cards
                    modelCards.forEach(card => {
                        const cardCategory = card.getAttribute('data-category');
                        if (category === 'all' || cardCategory === category) {
                            card.classList.remove('hidden');
                        } else {
                            card.classList.add('hidden');
                        }
                    });
                });
            });
        });

        // Expand/collapse functionality
        function toggleCard(modelName) {
            const card = document.getElementById('card-' + modelName);
            
            if (card.classList.contains('expanded')) {
                // Collapse
                card.classList.remove('expanded');
            } else {
                // Expand
                card.classList.add('expanded');
            }
        }
    </script>
</body>
</html>`;
}

function main() {
  try {
    // Read and parse the Prisma schema
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const models = parsePrismaSchema(schemaPath);
    
    // Sort models by category
    models.sort((a, b) => {
      const categoryA = getModelCategory(a.name);
      const categoryB = getModelCategory(b.name);
      const categoryOrder = ['core', 'gamification', 'health', 'user', 'communication', 'payment', 'terra'];
      return categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB);
    });

    const html = generateHtml(models);
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'prisma', 'database-schema-diagram.html');
    fs.writeFileSync(outputPath, html);
    
    console.log(`✅ Database schema diagram generated successfully!`);
    console.log(`📁 File saved to: ${outputPath}`);
    console.log(`📊 Total models: ${models.length}`);
    
    // Count models by category
    const categoryCounts = {};
    models.forEach(model => {
      const category = getModelCategory(model.name);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log(`📈 Models by category:`);
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} models`);
    });

    // Show relationship statistics
    let totalRelationships = 0;
    models.forEach(model => {
      totalRelationships += model.relationFields.length;
    });
    
    console.log(`\n🔗 Relationship Statistics:`);
    console.log(`   Total relationships: ${totalRelationships}`);
    
    // Show some sample relationships
    console.log(`\n🔍 Sample relationships:`);
    const userModel = models.find(m => m.name === 'User');
    if (userModel && userModel.relationFields.length > 0) {
      userModel.relationFields.slice(0, 3).forEach(field => {
        const targetModel = field.type.replace('[]', '').replace('?', '');
        console.log(`   User.${field.name} → ${targetModel}.${field.relation?.references[0] || 'id'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error generating schema diagram:', error);
  }
}

main(); 
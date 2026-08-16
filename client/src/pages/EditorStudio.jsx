import React, { useState } from 'react';
import { api } from '../utils/api';
import { renderMarkdown } from '../utils/helpers';
import { useToast } from '../components/Toast';
import { 
  PenSquare, 
  Eye, 
  Plus, 
  Trash2, 
  Send, 
  Save, 
  Code, 
  Bold, 
  Italic, 
  Heading, 
  ListOrdered, 
  Quote, 
  Lightbulb, 
  CheckSquare, 
  HelpCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

const PRESET_COVERS = [
  { label: 'Cloud Architecture', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Neural AI', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Modern UI Code', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Database Systems', url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Developer Setup', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80' }
];

export default function EditorStudio({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Engineering & Architecture');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [authorName, setAuthorName] = useState('Elena Rostova');
  const [authorRole, setAuthorRole] = useState('Principal Systems Architect');
  const [content, setContent] = useState(`## Overview\n\nExplain the architectural challenge or engineering problem here.\n\n### The Solution\n\nWalk through your solution step by step with code examples.\n\n\`\`\`javascript\n// Example implementation\nexport async function handleRequest() {\n  return { success: true };\n}\n\`\`\`\n\n> 💡 **Key Takeaway:** Always benchmark before and after applying optimizations.`);
  
  const [tagsInput, setTagsInput] = useState('Node.js, TypeScript, Architecture');
  const [actionItems, setActionItems] = useState([
    { title: 'Run baseline benchmark', description: 'Measure initial latency and throughput metrics.', code_snippet: 'npm run bench', resource_url: '' },
    { title: 'Implement optimization pattern', description: 'Apply the connection pool and caching changes.', code_snippet: '', resource_url: '' }
  ]);
  const [includePoll, setIncludePoll] = useState(true);
  const [pollQuestion, setPollQuestion] = useState('Which database caching strategy works best in your workflow?');
  const [pollOptions, setPollOptions] = useState(['Redis In-Memory', 'Memcached', 'SQLite Read-Through', 'Application Cache']);
  
  const [activeTab, setActiveTab] = useState('split'); // 'split' | 'edit' | 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const insertMarkdownSyntax = (syntaxType) => {
    let snippet = '';
    switch (syntaxType) {
      case 'bold': snippet = '**bold text**'; break;
      case 'italic': snippet = '*italic text*'; break;
      case 'h2': snippet = '\n\n## Section Title\n'; break;
      case 'h3': snippet = '\n\n### Subsection Title\n'; break;
      case 'code': snippet = '\n```javascript\n// Write code here\n```\n'; break;
      case 'quote': snippet = '\n> Add your quote or principle here\n'; break;
      case 'tip': snippet = '\n> 💡 **Actionable Tip:** Practical insight for developers\n'; break;
      case 'divider': snippet = '\n\n---\n\n'; break;
      default: break;
    }
    setContent(prev => prev + snippet);
  };

  const handleAddActionItem = () => {
    setActionItems(prev => [
      ...prev,
      { title: '', description: '', code_snippet: '', resource_url: '' }
    ]);
  };

  const handleRemoveActionItem = (index) => {
    setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleActionChange = (index, field, value) => {
    setActionItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index, value) => {
    setPollOptions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (isPublished = true) => {
    if (!title.trim() || !content.trim()) {
      addToast('Please provide at least a title and content for your article', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const cleanedActions = actionItems
        .filter(a => a.title && a.title.trim())
        .map(a => ({
          title: a.title.trim(),
          description: a.description ? a.description.trim() : '',
          code_snippet: a.code_snippet ? a.code_snippet.trim() : '',
          resource_url: a.resource_url ? a.resource_url.trim() : ''
        }));

      let pollData = null;
      if (includePoll && pollQuestion.trim()) {
        const cleanedOpts = pollOptions.filter(o => o && o.trim());
        if (cleanedOpts.length >= 2) {
          pollData = {
            question: pollQuestion.trim(),
            options: cleanedOpts
          };
        }
      }

      const postPayload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        category,
        difficulty,
        cover_image: coverImage,
        author_name: authorName.trim() || 'Alex Vance',
        author_role: authorRole.trim() || 'Staff Engineer',
        is_published: isPublished ? 1 : 0,
        is_featured: 0,
        tags: parsedTags,
        action_items: cleanedActions,
        poll: pollData
      };

      const res = await api.createPost(postPayload);
      addToast('Article published successfully!', 'success');
      if (onPostCreated) {
        onPostCreated(res.slug);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      addToast(err.message || 'Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-studio-container">
      {/* Studio Header Toolbar */}
      <div className="editor-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
            <PenSquare size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Author Studio</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Draft and publish actionable engineering tutorials
            </p>
          </div>
        </div>

        <div className="editor-actions-group">
          <div className="view-toggle-btns" style={{ marginRight: '8px' }}>
            <button 
              className={`view-btn ${activeTab === 'split' ? 'active' : ''}`}
              onClick={() => setActiveTab('split')}
            >
              Split
            </button>
            <button 
              className={`view-btn ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Editor
            </button>
            <button 
              className={`view-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <Save size={15} />
            <span>Draft</span>
          </button>

          <button 
            className="btn-primary"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            style={{ fontSize: '0.85rem', padding: '8px 18px' }}
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Split Panes */}
      <div className="editor-split-panes" style={
        activeTab === 'edit' 
          ? { gridTemplateColumns: '1fr' } 
          : activeTab === 'preview' 
          ? { gridTemplateColumns: '1fr' } 
          : {}
      }>
        {/* Left Pane: Editor */}
        {(activeTab === 'split' || activeTab === 'edit') && (
          <div className="editor-pane-card">
            {/* Metadata Fields */}
            <div className="editor-field-group">
              <label className="editor-label">Article Title</label>
              <input
                type="text"
                className="editor-input"
                placeholder="e.g., Architecting Event-Driven Microservices in Node.js"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: 700 }}
              />
            </div>

            <div className="editor-field-group">
              <label className="editor-label">Subtitle / Hook</label>
              <input
                type="text"
                className="editor-input"
                placeholder="A high-level summary of what the reader will build or learn..."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            {/* Category & Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label className="editor-label">Category</label>
                <select 
                  className="editor-input" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Engineering & Architecture">Engineering & Architecture</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="UI/UX & Design">UI/UX & Design</option>
                  <option value="Productivity & DevOps">Productivity & DevOps</option>
                </select>
              </div>

              <div>
                <label className="editor-label">Difficulty Level</label>
                <select 
                  className="editor-input" 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Cover Image Presets */}
            <div className="editor-field-group">
              <label className="editor-label">Cover Image</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn-ghost ${coverImage === preset.url ? 'badge-gradient' : ''}`}
                    onClick={() => setCoverImage(preset.url)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="editor-input"
                placeholder="Or paste custom image URL..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Markdown Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '10px',
              flexWrap: 'wrap'
            }}>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('bold')} title="Bold">
                <Bold size={14} />
              </button>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('italic')} title="Italic">
                <Italic size={14} />
              </button>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('h2')} title="H2 Heading">
                <Heading size={14} />
              </button>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('code')} title="Code Block">
                <Code size={14} />
              </button>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('quote')} title="Quote">
                <Quote size={14} />
              </button>
              <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => insertMarkdownSyntax('tip')} title="Action Tip">
                <Lightbulb size={14} />
              </button>
            </div>

            {/* Markdown Content Area */}
            <div className="editor-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="editor-label">Article Body (Markdown)</label>
              <textarea
                className="editor-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in Markdown..."
              />
            </div>

            {/* Action Checklist Builder */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Action Checklist Steps</span>
                </div>
                <button type="button" className="btn-ghost" onClick={handleAddActionItem} style={{ fontSize: '0.8rem' }}>
                  <Plus size={14} />
                  <span>Add Step</span>
                </button>
              </div>

              {actionItems.map((item, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      STEP {idx + 1}
                    </span>
                    <button type="button" onClick={() => handleRemoveActionItem(idx)} style={{ color: 'var(--rose)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="editor-input"
                    placeholder="Step Title (e.g. Set up Redis connection pool)"
                    value={item.title}
                    onChange={(e) => handleActionChange(idx, 'title', e.target.value)}
                    style={{ marginBottom: '6px', fontSize: '0.85rem' }}
                  />

                  <input
                    type="text"
                    className="editor-input"
                    placeholder="Step description or rule..."
                    value={item.description}
                    onChange={(e) => handleActionChange(idx, 'description', e.target.value)}
                    style={{ marginBottom: '6px', fontSize: '0.85rem' }}
                  />

                  <input
                    type="text"
                    className="editor-input"
                    placeholder="Optional code snippet..."
                    value={item.code_snippet}
                    onChange={(e) => handleActionChange(idx, 'code_snippet', e.target.value)}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              ))}
            </div>

            {/* Poll Builder */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Interactive Reader Poll</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includePoll}
                    onChange={(e) => setIncludePoll(e.target.checked)}
                  />
                  <span>Enable Poll</span>
                </label>
              </div>

              {includePoll && (
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="text"
                    className="editor-input"
                    placeholder="Poll Question (e.g. Which architectural pattern do you prefer?)"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    style={{ marginBottom: '10px' }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="editor-input"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => handleRemovePollOption(idx)} style={{ color: 'var(--rose)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button type="button" className="btn-ghost" onClick={handleAddPollOption} style={{ fontSize: '0.8rem', alignSelf: 'flex-start', marginTop: '4px' }}>
                        <Plus size={14} />
                        <span>Add Option</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="editor-field-group" style={{ marginTop: '20px' }}>
              <label className="editor-label">Tags (Comma-separated)</label>
              <input
                type="text"
                className="editor-input"
                placeholder="e.g. Node.js, Architecture, Redis, Scalability"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right Pane: Live Visual Preview */}
        {(activeTab === 'split' || activeTab === 'preview') && (
          <div className="editor-pane-card preview-pane-scroll">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)' }}>
              <Eye size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Live Reader Preview</span>
            </div>

            <div className="article-header">
              <div className="article-category-badge">
                <span className="badge-gradient">{category}</span>
                <span className="badge-outline" style={{ marginLeft: '8px' }}>{difficulty}</span>
              </div>
              <h1 className="article-title">{title || 'Untitled Article'}</h1>
              {subtitle && <p className="article-subtitle">{subtitle}</p>}
            </div>

            {coverImage && (
              <div className="article-featured-img-box" style={{ marginBottom: '24px' }}>
                <img src={coverImage} alt="Cover Preview" style={{ maxHeight: '280px' }} />
              </div>
            )}

            <div 
              className="article-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tests for wikilink application
 */

import { describe, it, expect } from 'vitest';
import { applyWikilinks, suggestWikilinks } from '../src/wikilinks.js';

describe('applyWikilinks', () => {
  it('should apply wikilinks to matching entities', () => {
    const content = 'Working with Claude Code on the project';
    const entities = ['Claude Code'];
    const result = applyWikilinks(content, entities);

    expect(result.content).toBe('Working with [[Claude Code]] on the project');
    expect(result.linksAdded).toBe(1);
    expect(result.linkedEntities).toContain('Claude Code');
  });

  it('should apply multiple wikilinks', () => {
    const content = 'Using React and TypeScript for the API';
    const entities = ['React', 'TypeScript', 'API'];
    const result = applyWikilinks(content, entities);

    expect(result.content).toContain('[[React]]');
    expect(result.content).toContain('[[TypeScript]]');
    expect(result.content).toContain('[[API]]');
    expect(result.linksAdded).toBe(3);
  });

  it('should only link first occurrence by default', () => {
    const content = 'React is great. I love React. React rocks!';
    const entities = ['React'];
    const result = applyWikilinks(content, entities);

    expect(result.content).toBe('[[React]] is great. I love React. React rocks!');
    expect(result.linksAdded).toBe(1);
  });

  it('should link all occurrences when firstOccurrenceOnly is false', () => {
    const content = 'React is great. I love React.';
    const entities = ['React'];
    const result = applyWikilinks(content, entities, { firstOccurrenceOnly: false });

    expect(result.content).toBe('[[React]] is great. I love [[React]].');
    expect(result.linksAdded).toBe(2);
  });

  it('should not link inside existing wikilinks', () => {
    const content = 'See [[React Guide]] for React tips';
    const entities = ['React'];
    const result = applyWikilinks(content, entities);

    // Should only link the standalone "React", not the one in [[React Guide]]
    expect(result.content).toBe('See [[React Guide]] for [[React]] tips');
    expect(result.linksAdded).toBe(1);
  });

  it('should not link inside code blocks', () => {
    const content = 'Use React:\n```\nimport React from "react";\n```\nReact is awesome';
    const entities = ['React'];
    const result = applyWikilinks(content, entities);

    // Should not link React inside code block, only the first valid occurrence
    expect(result.content).toContain('Use [[React]]:');
    expect(result.content).toContain('```\nimport React from "react";\n```');
    // With firstOccurrenceOnly=true (default), only first valid occurrence is linked
    expect(result.linksAdded).toBe(1);
  });

  it('should link all valid occurrences outside code blocks when firstOccurrenceOnly is false', () => {
    const content = 'Use React:\n```\nimport React from "react";\n```\nReact is awesome';
    const entities = ['React'];
    const result = applyWikilinks(content, entities, { firstOccurrenceOnly: false });

    // Should link both valid occurrences but not the one in code block
    expect(result.content).toContain('Use [[React]]:');
    expect(result.content).toContain('```\nimport React from "react";\n```');
    expect(result.content).toContain('[[React]] is awesome');
    expect(result.linksAdded).toBe(2);
  });

  it('should not link inside inline code', () => {
    const content = 'Run `npm install react` to get React';
    const entities = ['React', 'react'];
    const result = applyWikilinks(content, entities);

    // Should not link inside inline code
    expect(result.content).toContain('`npm install react`');
    expect(result.content).toContain('to get [[React]]');
  });

  it('should not link in frontmatter', () => {
    const content = `---
title: React Guide
tags: [react]
---
Learn React here`;
    const entities = ['React'];
    const result = applyWikilinks(content, entities);

    // Should not link in frontmatter
    expect(result.content).toContain('title: React Guide');
    expect(result.content).toContain('Learn [[React]] here');
    expect(result.linksAdded).toBe(1);
  });

  it('should not link URLs', () => {
    const content = 'Visit https://react.dev to learn React';
    const entities = ['React'];
    const result = applyWikilinks(content, entities);

    expect(result.content).toContain('https://react.dev');
    expect(result.content).toContain('learn [[React]]');
  });

  it('should prioritize longer matches', () => {
    const content = 'Working with API Management and the API';
    const entities = ['API', 'API Management'];
    const result = applyWikilinks(content, entities);

    // Should link "API Management" first, then standalone "API"
    expect(result.content).toContain('[[API Management]]');
    expect(result.content).toContain('and the [[API]]');
  });

  it('should exclude common words', () => {
    const content = 'Meeting on Monday for the project';
    const entities = ['Monday', 'Project'];
    const result = applyWikilinks(content, entities);

    // Monday should be excluded
    expect(result.content).not.toContain('[[Monday]]');
    expect(result.content).toContain('[[Project]]');
  });

  it('should handle case-insensitive matching', () => {
    const content = 'Using react for development';
    const entities = ['React'];
    const result = applyWikilinks(content, entities, { caseInsensitive: true });

    expect(result.content).toBe('Using [[React]] for development');
  });

  it('should respect word boundaries', () => {
    const content = 'The API and APIManager are different';
    const entities = ['API'];
    const result = applyWikilinks(content, entities);

    // Should only link standalone "API", not "API" within "APIManager"
    expect(result.content).toBe('The [[API]] and APIManager are different');
    expect(result.linksAdded).toBe(1);
  });

  it('should return unchanged content with no entities', () => {
    const content = 'Some text here';
    const result = applyWikilinks(content, []);

    expect(result.content).toBe(content);
    expect(result.linksAdded).toBe(0);
  });
});

describe('suggestWikilinks', () => {
  it('should suggest wikilinks without applying them', () => {
    const content = 'Working with React today';
    const entities = ['React'];
    const suggestions = suggestWikilinks(content, entities);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].entity).toBe('React');
    expect(suggestions[0].start).toBeGreaterThan(0);
    expect(suggestions[0].end).toBeGreaterThan(suggestions[0].start);
  });

  it('should include context in suggestions', () => {
    const content = 'I am working with React for this project';
    const entities = ['React'];
    const suggestions = suggestWikilinks(content, entities);

    expect(suggestions[0].context).toContain('React');
  });

  it('should skip protected zones', () => {
    const content = 'Code: `React` and React framework';
    const entities = ['React'];
    const suggestions = suggestWikilinks(content, entities);

    // Should only suggest the second React (outside inline code)
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].start).toBeGreaterThan(content.indexOf('`React`'));
  });
});

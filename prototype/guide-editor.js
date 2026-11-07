import { Editor, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { safeGuideLink, renderGuideDocument } from '../src/guide-document.ts';

function legacyDocument(text, images) {
  const paragraphs = String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const content = [];
  (paragraphs.length ? paragraphs : ['']).forEach((paragraph, index) => {
    const lines = paragraph.split('\n');
    content.push({ type: 'paragraph', content: lines.flatMap((line, i) => [
      ...(i ? [{ type: 'hardBreak' }] : []), ...(line ? [{ type: 'text', text: line }] : [])
    ]) });
    images.filter(image => Math.min(paragraphs.length || 1, Math.max(1, image.afterParagraph || 1)) === index + 1)
      .forEach(image => content.push({ type: 'guideImage', attrs: { imageId: image.id } }));
  });
  return { type: 'doc', content };
}
function create({ element, toolbar, content, images, source, onChange, openLink }) {
  let editor;
  const picture = Node.create({
    name: 'guideImage', group: 'block', atom: true, draggable: true,
    addAttributes: () => ({ imageId: { default: '' } }),
    parseHTML: () => [{ tag: 'figure[data-guide-image-id]', getAttrs: element => images().some(image => image.id === element.dataset.guideImageId) ? { imageId: element.dataset.guideImageId } : false }],
    renderHTML: ({ node }) => ['figure', { 'data-guide-image-id': node.attrs.imageId }],
    addNodeView() {
      return ({ node, getPos }) => {
        const figure = document.createElement('figure');
        figure.className = 'guide-editor-image';
        figure.contentEditable = 'false';
        figure.dataset.guideImageId = node.attrs.imageId;
        const img = document.createElement('img');
        const caption = document.createElement('figcaption');
        const actions = document.createElement('div');
        actions.className = 'guide-image-actions';
        const refresh = () => {
          const image = images().find(image => image.id === node.attrs.imageId);
          img.src = source(image?.src || ''); img.alt = image?.alt || 'Bildbeschreibung ergänzen';
          caption.textContent = image?.caption || '';
          caption.hidden = !image?.caption;
        };
        for (const [label, direction] of [['Bild nach oben', -1], ['Bild nach unten', 1], ['Aus Text entfernen', 0]]) {
          const button = document.createElement('button');
          button.type = 'button'; button.textContent = label; button.className = 'btn secondary';
          button.addEventListener('mousedown', event => event.preventDefault());
          button.addEventListener('click', () => {
            const pos = getPos(); if (typeof pos !== 'number') return;
            const resolved = editor.state.doc.resolve(pos);
            const index = resolved.index();
            if (direction < 0 && resolved.parent.type.name === 'listItem' && index === 1) return;
            const sibling = resolved.parent.maybeChild(index + direction);
            if (direction && !sibling) return;
            const target = direction < 0 ? pos - sibling.nodeSize : pos + sibling.nodeSize;
            const transaction = editor.state.tr.delete(pos, pos + node.nodeSize);
            if (direction) transaction.insert(target, node);
            editor.view.dispatch(transaction);
            if (direction) editor.commands.setNodeSelection(target);
            editor.commands.focus();
          });
          actions.append(button);
        }
        figure.append(img, caption, actions); refresh();
        return { dom: figure, update(next) { if (next.type.name !== 'guideImage') return false; node = next; refresh(); return true; }, ignoreMutation: () => true };
      };
    }
  });
  editor = new Editor({
    element,
    extensions: [StarterKit.configure({
      heading: { levels: [2, 3] }, code: false, codeBlock: false,
      link: { openOnClick: false, autolink: false, isAllowedUri: url => safeGuideLink(url) }
    }), picture],
    content,
    editorProps: {
      attributes: { id: 'guide-text', role: 'textbox', 'aria-label': 'Anleitungstext', 'aria-multiline': 'true', 'aria-required': 'true', 'aria-describedby': 'guide-editor-help' },
      handleDOMEvents: { drop(view, event) {
        if (event.dataTransfer?.files.length) { event.preventDefault(); return true; } return false;
      } }
    },
    onUpdate: () => { onChange(); updateToolbar(); },
    onSelectionUpdate: () => updateToolbar()
  });
  function updateToolbar() {
    toolbar.querySelectorAll('[data-guide-command]').forEach(button => {
      const name = button.dataset.guideCommand;
      const active = name === 'h2' || name === 'h3' ? editor.isActive('heading', { level: Number(name.slice(1)) }) : editor.isActive(name);
      if (!['undo', 'redo', 'clear'].includes(name)) button.setAttribute('aria-pressed', String(active));
      if (name === 'undo' || name === 'redo') button.disabled = !editor.can()[name]();
    });
  }
  toolbar.querySelectorAll('[data-guide-command]').forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => {
      const name = button.dataset.guideCommand;
      if (name === 'link') { openLink(editor.getAttributes('link').href || ''); return; }
      const chain = editor.chain().focus();
      const commands = { bold: 'toggleBold', italic: 'toggleItalic', underline: 'toggleUnderline', strike: 'toggleStrike', bulletList: 'toggleBulletList', orderedList: 'toggleOrderedList', blockquote: 'toggleBlockquote', undo: 'undo', redo: 'redo', horizontalRule: 'setHorizontalRule' };
      if (name === 'h2' || name === 'h3') chain.toggleHeading({ level: Number(name.slice(1)) }).run();
      else if (name === 'clear') chain.clearNodes().unsetAllMarks().run();
      else if (commands[name]) chain[commands[name]]().run();
    });
  });
  updateToolbar();
  return {
    editor,
    document: () => editor.getJSON(),
    text: () => editor.getText({ blockSeparator: '\n\n' }).trim(),
    insertImage(id) { editor.chain().focus().insertContent([{ type: 'guideImage', attrs: { imageId: id } }, { type: 'paragraph' }]).run(); },
    removeImage(id) {
      const positions = [];
      editor.state.doc.descendants((node, pos) => { if (node.type.name === 'guideImage' && node.attrs.imageId === id) positions.push({ pos, size: node.nodeSize }); });
      const tr = editor.state.tr; positions.reverse().forEach(({pos, size}) => tr.delete(pos, pos + size));
      editor.view.dispatch(tr);
    },
    refreshImages() {
      editor.view.dom.querySelectorAll('figure[data-guide-image-id]').forEach(figure => {
        const image = images().find(image => image.id === figure.dataset.guideImageId);
        figure.querySelector('img').src = source(image?.src || '');
        figure.querySelector('img').alt = image?.alt || 'Bildbeschreibung ergänzen';
        figure.querySelector('figcaption').textContent = image?.caption || '';
        figure.querySelector('figcaption').hidden = !image?.caption;
      });
    },
    setLink(href) {
      if (href && !safeGuideLink(href)) return false;
      const chain = editor.chain().focus().extendMarkRange('link');
      if (href) chain.setLink({ href }).run(); else chain.unsetLink().run();
      return true;
    },
    destroy: () => editor.destroy()
  };
}
window.GuideEditor = { create, legacyDocument, renderDocument: renderGuideDocument };

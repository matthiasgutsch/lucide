import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  parseFigmaLink,
  extractSvgFromFigma,
  svgToLucideIconData,
  generateIconCode,
} from '../icons/figma-icon-extractor';

interface IconPreview {
  name: string;
  svg: string;
  code: string;
  timestamp: number;
}

const STORAGE_KEY = 'figma_extractor_token';

@Component({
  selector: 'app-figma-extractor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="figma-extractor-container">
      <div class="extractor-header">
        <h2>Add Icon from Figma</h2>
        <p class="subtitle">Extract SVG from Figma and add to your icon library</p>
      </div>

      <div class="extractor-content">
        <!-- Input Form -->
        <div class="form-section">
          <div class="form-group">
            <label for="figma-link">Figma Link</label>
            <input
              id="figma-link"
              type="url"
              [(ngModel)]="figmaLink"
              placeholder="https://figma.com/design/FILE_KEY/...?node-id=X:X"
              class="form-input"
            />
            <p class="help-text">Right-click icon in Figma → Copy/Paste → Copy link</p>
          </div>

          <div class="form-group">
            <label for="icon-name">Icon Name</label>
            <input
              id="icon-name"
              type="text"
              [(ngModel)]="iconName"
              placeholder="e.g., my-icon, star-filled"
              class="form-input"
            />
            <p class="help-text">Use kebab-case. Will be converted to DcIconName</p>
          </div>

          @if (!tokenSaved()) {
            <div class="form-group">
              <label for="figma-token">Figma Token</label>
              <input
                id="figma-token"
                type="password"
                [(ngModel)]="figmaToken"
                placeholder="Your Figma personal access token"
                class="form-input"
              />
              <p class="help-text">
                Get from
                <a href="https://www.figma.com/settings/tokens" target="_blank">
                  figma.com/settings/tokens
                </a>
              </p>
            </div>
          } @else {
            <div class="form-group token-saved-group">
              <p class="help-text token-saved-message">
                <lucide-icon name="check-circle" size="18"></lucide-icon>
                <span>Token saved securely</span>
              </p>
              <button (click)="showTokenInput()" class="change-token-btn">Change Token</button>
            </div>
          }

          <button
            (click)="extractIcon()"
            [disabled]="isLoading() || !figmaLink || !iconName"
            class="extract-btn"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Extracting...
            } @else {
              Extract Icon
            }
          </button>

          @if (error()) {
            <div class="error-message">
              <lucide-icon name="alert-circle" size="18"></lucide-icon>
              <span>{{ error() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div class="success-message">
              <lucide-icon name="check-circle" size="18"></lucide-icon>
              <span>{{ successMessage() }}</span>
            </div>
          }
        </div>

        <!-- Preview Section -->
        <div class="preview-section">
          <h3>Preview</h3>

          @if (!preview()) {
            <div class="empty-state">
              <lucide-icon name="image" size="48"></lucide-icon>
              <p>Extract an icon to see preview</p>
            </div>
          } @else {
            <div class="preview-content">
              <!-- SVG Preview -->
              <div class="svg-preview">
                <h4>SVG Preview</h4>
                <div class="svg-container">
                  <div [innerHTML]="preview()!.svg" class="svg-display"></div>
                </div>
              </div>

              <!-- Generated Code -->
              <div class="code-section">
                <div class="code-header">
                  <h4>Generated Code</h4>
                  <button (click)="copyCode()" class="copy-btn">
                    @if (!codeCopied()) {
                      <lucide-icon name="copy" size="16"></lucide-icon>
                      Copy
                    } @else {
                      <lucide-icon name="check" size="16"></lucide-icon>
                      Copied!
                    }
                  </button>
                </div>
                <pre class="code-block"><code>{{ preview()!.code }}</code></pre>
              </div>

              <!-- Actions -->
              <div class="action-buttons">
                <button (click)="resetForm()" class="btn-secondary">Clear</button>
                <button (click)="copyToClipboard()" class="btn-primary">
                  <lucide-icon name="download" size="16"></lucide-icon>
                  Add to Library
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions-section">
        <h3>How it works</h3>
        <ol>
          <li>
            Get a
            <a href="https://www.figma.com/settings/tokens" target="_blank">
              Figma personal access token
            </a>
          </li>
          <li>Copy the Figma link to your icon (right-click → Copy link)</li>
          <li>Enter a name for your icon</li>
          <li>Click "Extract Icon" to fetch and convert the SVG</li>
          <li>Review the generated code and click "Add to Library"</li>
          <li>Use your icon: <code>&lt;dc-icon name="icon-name" /&gt;</code></li>
        </ol>
      </div>
    </div>
  `,
  styles: `
    .figma-extractor-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .extractor-header {
      margin-bottom: 2rem;

      h2 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: #666;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .extractor-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .form-section {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      &:last-of-type {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #333;
        font-size: 0.9rem;
      }
    }

    .token-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: all 0.2s;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #1976d2;
        box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
      }

      &:disabled {
        background: #f0f0f0;
        cursor: not-allowed;
      }
    }

    .clear-token-btn {
      position: absolute;
      right: 10px;
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
      padding: 0.4rem;
      cursor: pointer;
      color: #999;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #e0e0e0;
        color: #666;
      }
    }

    .help-text {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.3rem;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      a {
        color: #1976d2;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .token-saved-group {
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .token-saved-message {
      color: #2e7d32;
      font-weight: 500;
      margin: 0 0 0.75rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .change-token-btn {
      display: block;
      padding: 0.6rem 1rem;
      background: #fff;
      border: 1px solid #c8e6c9;
      border-radius: 4px;
      color: #2e7d32;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #c8e6c9;
        border-color: #a5d6a7;
      }
    }

    .extract-btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        background: #1565c0;
        box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .error-message,
    .success-message {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 6px;
      display: flex;
      gap: 0.75rem;
      font-size: 0.9rem;
      align-items: center;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef5350;
    }

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #66bb6a;
    }

    .preview-section {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      min-height: 300px;

      p {
        margin-top: 1rem;
        font-size: 0.95rem;
      }
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .svg-preview {
      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      }
    }

    .svg-container {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 1.5rem;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 150px;
    }

    .svg-display {
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(svg) {
        width: 100px;
        height: 100px;
      }
    }

    .code-section {
      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      }
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;

      h4 {
        margin: 0;
      }
    }

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
        border-color: #999;
      }
    }

    .code-block {
      margin: 0;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.85rem;
      line-height: 1.5;

      code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: #333;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;

      button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
    }

    .btn-primary {
      background: #1976d2;
      color: white;

      &:hover {
        background: #1565c0;
      }
    }

    .btn-secondary {
      background: white;
      color: #333;
      border: 1px solid #ddd;

      &:hover {
        background: #f5f5f5;
        border-color: #999;
      }
    }

    .instructions-section {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
      }

      ol {
        margin: 0;
        padding-left: 1.5rem;
        line-height: 1.8;

        li {
          margin-bottom: 0.5rem;

          a {
            color: #1976d2;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }

          code {
            background: white;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.85rem;
            color: #c41c00;
          }
        }
      }
    }
  `,
})
export class FigmaExtractorComponent {
  figmaLink = signal('');
  iconName = signal('');
  figmaToken = signal('');
  isLoading = signal(false);
  error = signal('');
  successMessage = signal('');
  preview = signal<IconPreview | null>(null);
  codeCopied = signal(false);
  tokenSaved = signal(false);

  constructor() {
    // Load token from localStorage on init
    this.loadTokenFromStorage();

    // Save token to localStorage whenever it changes
    effect(() => {
      const token = this.figmaToken();
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
        this.tokenSaved.set(true);
      }
    });
  }

  private loadTokenFromStorage() {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      if (savedToken) {
        this.figmaToken.set(savedToken);
        this.tokenSaved.set(true);
      }
    } catch (error) {
      console.warn('Failed to load token from localStorage:', error);
    }
  }

  clearToken() {
    this.figmaToken.set('');
    this.tokenSaved.set(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear token from localStorage:', error);
    }
  }

  showTokenInput() {
    this.tokenSaved.set(false);
  }

  async extractIcon() {
    this.error.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    try {
      const link = this.figmaLink();
      const name = this.iconName();
      let token = this.figmaToken();

      if (!token) {
        // Try to get from environment variable
        token = (window as any).__FIGMA_TOKEN || '';
        if (!token) {
          throw new Error(
            'Figma token is required. Please enter your token or set FIGMA_TOKEN env variable.',
          );
        }
      }

      // Parse and validate link
      const parsed = parseFigmaLink(link);
      if (!parsed) {
        throw new Error(
          'Invalid Figma link. Expected format: https://figma.com/design/FILE_KEY/...?node-id=X:X',
        );
      }

      // Extract SVG from Figma
      const svg = await extractSvgFromFigma(link, token);
      if (!svg) {
        throw new Error('Failed to extract SVG from Figma. Check your token and link.');
      }

      // Convert to LucideIconData
      const iconData = svgToLucideIconData(svg, name);
      if (!iconData || iconData.length === 0) {
        throw new Error('Failed to convert SVG to icon data.');
      }

      // Generate code
      const code = generateIconCode({
        name,
        data: iconData,
        svgString: svg,
      });

      this.preview.set({
        name,
        svg,
        code,
        timestamp: Date.now(),
      });

      this.successMessage.set(`Icon "${name}" extracted successfully!`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      this.error.set(errorMsg);
      console.error('Extraction error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  copyCode() {
    if (!this.preview()) return;
    const code = this.preview()!.code;
    navigator.clipboard.writeText(code);
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 2000);
  }

  async copyToClipboard() {
    if (!this.preview()) return;
    const code = this.preview()!.code;
    await navigator.clipboard.writeText(code);
    this.successMessage.set('Code copied to clipboard! Paste it into custom-icons.ts');
  }

  resetForm() {
    this.figmaLink.set('');
    this.iconName.set('');
    this.figmaToken.set('');
    this.preview.set(null);
    this.error.set('');
    this.successMessage.set('');
  }
}

import { developHelper } from "@easyops/brick-kit";

const ANY_BRICK_EDITOR = "basic-bricks.any-brick--editor";

/**
 * Get editor brick name by brick name.
 *
 * @param brick - Brick name.
 *
 * @returns
 *
 * Returns editor brick name, will fallback to `basic-bricks.any-brick--editor`
 * if the relevant editor brick is not found.
 *
 * And returns undefined if load failed.
 */
export async function getEditorBrick(brick: string): Promise<string> {
  try {
    if (brick.includes("-")) {
      const actualEditorBrick = `${brick}--editor`;
      await developHelper.loadEditorBricks([actualEditorBrick]);
      if (customElements.get(actualEditorBrick)) {
        return actualEditorBrick;
      }
    }
    const fallbackEditorBrick = ANY_BRICK_EDITOR;
    await developHelper.loadEditorBricks([fallbackEditorBrick]);
    if (customElements.get(fallbackEditorBrick)) {
      return fallbackEditorBrick;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Load editor brick for "${brick}" failed:`, error);
  }
}

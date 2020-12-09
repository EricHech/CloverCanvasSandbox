import { Box } from './Box';

export class CanvasState {
  public tables: Box[];
  public dragging: Box | null;
  public resizing: Box | null;
  public selected: Box | null;
  public height: number;
  public width: number;
  public ctx: CanvasRenderingContext2D | null;
  public mouseRelativePosX: number;
  public mouseRelativePosY: number;
  public dx: number;
  public dy: number;

  constructor(width: number, height: number) {
    this.ctx = null;
    this.tables = [];
    this.dragging = null;
    this.resizing = null;
    this.selected = null;
    this.width = width;
    this.height = height;

    this.mouseRelativePosX = 0;
    this.mouseRelativePosY = 0;

    this.dx = 0;
    this.dy = 0;
  }

  addContext = (ctx: CanvasRenderingContext2D) => {
    this.ctx = ctx;
  }

  addTable = (table: Box): Box => {
    this.tables.push(table);
    return table;
  }

  render = () => {
    this.ctx!.clearRect(0, 0, this.width, this.height);
    this.tables.forEach((table) => table.render());

    requestAnimationFrame(() => this.render());
  }
}

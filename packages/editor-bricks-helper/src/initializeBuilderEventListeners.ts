import {
  BuilderEventType,
  BuilderRuntimeNode,
  EventDetailOfNodeAdd,
  EventDetailOfNodeAddStored,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
} from "./interfaces";
import { handleBuilderDataInit } from "./internal/handleBuilderDataInit";
import { handleBuilderNodeAdd } from "./internal/handleBuilderNodeAdd";
import { handleBuilderNodeAddStored } from "./internal/handleBuilderNodeAddStored";
import { handleBuilderNodeReorder } from "./internal/handleBuilderNodeReorder";
import { handleBuilderNodeMove } from "./internal/handleBuilderNodeMove";

const onDataInit = ((event: CustomEvent<BuilderRuntimeNode>) => {
  handleBuilderDataInit(event.detail);
  window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
}) as EventListener;

const onNodeAdd = ((event: CustomEvent<EventDetailOfNodeAdd>) => {
  handleBuilderNodeAdd(event.detail);
  window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
}) as EventListener;

const onNodeAddStored = ((event: CustomEvent<EventDetailOfNodeAddStored>) => {
  handleBuilderNodeAddStored(event.detail);
  window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
}) as EventListener;

const onNodeReorder = ((event: CustomEvent<EventDetailOfNodeReorder>) => {
  handleBuilderNodeReorder(event.detail);
  window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
}) as EventListener;

const onNodeMove = ((event: CustomEvent<EventDetailOfNodeMove>) => {
  handleBuilderNodeMove(event.detail);
  window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
}) as EventListener;

export function initializeBuilderEventListeners(): void {
  window.addEventListener(BuilderEventType.DATA_INIT, onDataInit);
  window.addEventListener(BuilderEventType.NODE_ADD, onNodeAdd);
  window.addEventListener(BuilderEventType.NODE_ADD_STORED, onNodeAddStored);
  window.addEventListener(BuilderEventType.NODE_REORDER, onNodeReorder);
  window.addEventListener(BuilderEventType.NODE_MOVE, onNodeMove);
}

export function clearBuilderEventListeners(): void {
  window.removeEventListener(BuilderEventType.DATA_INIT, onDataInit);
  window.removeEventListener(BuilderEventType.NODE_ADD, onNodeAdd);
  window.removeEventListener(BuilderEventType.NODE_ADD_STORED, onNodeAddStored);
  window.removeEventListener(BuilderEventType.NODE_REORDER, onNodeReorder);
  window.removeEventListener(BuilderEventType.NODE_MOVE, onNodeMove);
}

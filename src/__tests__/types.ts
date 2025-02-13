export type Trace = TraceStep[];
export type TraceStep = TraceStepInsert | TraceStepDelete | TraceStepClear;
export type TraceStepInsert = ['insert', number, number];
export type TraceStepDelete = ['delete', number];
export type TraceStepClear = ['clear'];

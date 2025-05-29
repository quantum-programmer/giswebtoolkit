import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { BaseComponentTaskState } from './BaseComponentTask';

@Component
export default class BaseComponentWidget extends BaseGwtkVueComponent {
    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof BaseComponentTaskState>(key: K, value: BaseComponentTaskState[K]) => void;
}

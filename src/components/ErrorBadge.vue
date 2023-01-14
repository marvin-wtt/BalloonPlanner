<template>
  <q-badge
    v-if="priorityMessage"
    :color="priorityMessage.bgColor"
    floating
    rounded
  >
    {{ messages.length }}
    <q-icon
      :name="priorityMessage.icon"
      :color="priorityMessage.textColor"
      :size="size"
    />
    <q-tooltip>
      {{ priorityMessage.message }}
    </q-tooltip>
  </q-badge>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  messages: MessageBadge[];
  size?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: '1rem',
});

const priorityMessage = computed<MessageBadge | undefined>(() => {
  return [...props.messages].sort((a, b) => a.priority - b.priority).at(0);
});

class MessageBadge {
  public priority: number;
  public message: string;
  public textColor: string;
  public bgColor: string;
  public icon: string;

  constructor(
    message: string,
    priority: number,
    textColor: string,
    bgColor: string,
    icon: string
  ) {
    this.message = message;
    this.priority = priority;
    this.textColor = textColor;
    this.bgColor = bgColor;
    this.icon = icon;
  }
}

class ErrorMessageBadge extends MessageBadge {
  constructor(message: string) {
    super(message, 1, 'white', 'negative', 'error');
  }
}

class WarningMessageBadge extends MessageBadge {
  constructor(message: string) {
    super(message, 2, 'white', 'warning', 'warning');
  }
}

class InfoMessageBadge extends MessageBadge {
  constructor(message: string) {
    super(message, 3, 'white', 'info', 'info');
  }
}

class HelpMessageBadge extends MessageBadge {
  constructor(message: string) {
    super(message, 4, 'white', 'accent', 'help');
  }
}
</script>

<style scoped></style>

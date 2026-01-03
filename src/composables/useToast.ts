import { ref } from 'vue';

// Referência global para o componente ToastNotification
let toastRef: any = null;

export function setToastRef(ref: any) {
  toastRef = ref;
}

export function useToast() {
  return {
    success: (message: string) => {
      if (toastRef?.value) {
        toastRef.value.show(message, 'success');
      } else {
        console.warn('Toast ref not available:', message);
      }
    },
    error: (message: string) => {
      if (toastRef?.value) {
        toastRef.value.show(message, 'error');
      } else {
        console.warn('Toast error:', message);
      }
    },
  };
}

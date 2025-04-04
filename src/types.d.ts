declare module "onnxruntime-web" {
    export class InferenceSession {
        static create(
            modelPath: string,
            options?: { executionProviders?: string[] }
        ): Promise<InferenceSession>;
        run: any
    }
    export const Tensor: any
}
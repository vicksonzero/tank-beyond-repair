import { Debug } from "debug";

declare global {
    interface Window {
        _Debug: Debug;
    }
}

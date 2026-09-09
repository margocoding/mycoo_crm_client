import axios from "axios";
import { api } from "./base.api";
import { CompleteOnboardingDto } from "@/types/workspace.types";
import { SuccessRdo } from "@/types/global.types";

export const workspaceApi = {
  completeOnboarding: async (dto: CompleteOnboardingDto): Promise<SuccessRdo> => {
    const { data } = await api.post<SuccessRdo>("/workspace/onboarding/complete", dto);
    return data;
  },
};
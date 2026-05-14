"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Calendar, MapPin, MessageSquare, UserRound } from "lucide-react";
import {
  defaultIntakeProfile,
  focusAreaLabels,
  focusAreaValues,
  IntakeProfileSchema,
  reportToneLabels,
  reportToneValues,
  type IntakeProfile,
} from "@/lib/schemas/intake";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-cinnabar">{message}</p> : null;
}

export function IntakeForm() {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeProfile>({
    resolver: zodResolver(IntakeProfileSchema),
    defaultValues: defaultIntakeProfile,
  });

  function onSubmit(values: IntakeProfile) {
    sessionStorage.setItem("cyberFateIntake", JSON.stringify(values));
    router.push("/generate");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 rounded-[8px] border border-brass/30 bg-paper/5 p-5 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="flex items-center gap-2 text-sm font-semibold text-bone">
            <UserRound className="h-4 w-4 text-aurora" />
            姓名或昵称
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("displayName")}
          />
          <FieldError message={errors.displayName?.message} />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-sm font-semibold text-bone">
            <Calendar className="h-4 w-4 text-aurora" />
            出生日期
          </span>
          <input
            type="date"
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("birthDate")}
          />
          <FieldError message={errors.birthDate?.message} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-bone">出生时间</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            placeholder="09:30 / 上午 / 未知"
            {...register("birthTime")}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-bone">时间精度</span>
          <select
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("birthTimeStatus")}
          >
            <option value="known">精确</option>
            <option value="approximate">大约</option>
            <option value="unknown">未知</option>
          </select>
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-sm font-semibold text-bone">
            <MapPin className="h-4 w-4 text-aurora" />
            出生地
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("birthPlace")}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-bone">当前居住城市</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("currentCity")}
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-bone">关心领域</legend>
        <Controller
          control={control}
          name="focusAreas"
          render={({ field }) => (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {focusAreaValues.map((area) => {
                const checked = field.value.includes(area);
                return (
                  <label
                    key={area}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-brass/25 bg-ink/70 p-3 text-sm hover:border-aurora/70"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const next = value
                          ? [...field.value, area]
                          : field.value.filter((item) => item !== area);
                        field.onChange(next);
                      }}
                    />
                    {focusAreaLabels[area]}
                  </label>
                );
              })}
            </div>
          )}
        />
        <FieldError message={errors.focusAreas?.message} />
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-bone">报告语气</span>
          <select
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            {...register("reportTone")}
          >
            {reportToneValues.map((tone) => (
              <option key={tone} value={tone}>
                {reportToneLabels[tone]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold text-bone">住宅/工作位朝向</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-brass/30 bg-ink px-3 text-paper outline-none focus:border-aurora"
            placeholder="东南 / 靠窗 / 不确定"
            {...register("homeDirection")}
          />
        </label>
      </div>

      <label className="block">
        <span className="flex items-center gap-2 text-sm font-semibold text-bone">
          <MessageSquare className="h-4 w-4 text-aurora" />
          想问的问题
        </span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-brass/30 bg-ink p-3 text-paper outline-none focus:border-aurora"
          {...register("question")}
        />
        <FieldError message={errors.question?.message} />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-bone">空间描述</span>
        <textarea
          className="mt-2 min-h-20 w-full rounded-md border border-brass/30 bg-ink p-3 text-paper outline-none focus:border-aurora"
          {...register("homeLayoutNotes")}
        />
        <FieldError message={errors.homeLayoutNotes?.message} />
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          进入生成流程
        </Button>
      </div>
    </form>
  );
}
